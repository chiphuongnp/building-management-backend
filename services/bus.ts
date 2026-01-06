import { Response } from 'express';
import { BusSeatStatus, BusStatus, Collection, Sites } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { Bus, BusSeat } from '../interfaces/bus';
import {
  firebaseHelper,
  responseError,
  responseSuccess,
  logger,
  deleteImages,
  capitalizeName,
} from '../utils/index';
import { OrderByDirection, WhereFilterOp } from 'firebase-admin/firestore';
import { DEFAULT_PAGE_TOTAL } from '../constants/constant';

const busCollection = `${Sites.TOKYO}/${Collection.BUSES}`;
const generateSeats = (capacity: number): BusSeat[] => {
  return Array.from({ length: capacity }, (_, index) => ({
    seat_number: (index + 1).toString(),
    status: BusSeatStatus.AVAILABLE,
  }));
};

export const createBus = async (req: AuthRequest, res: Response) => {
  try {
    const data: Bus = req.body;
    const numberSnapshot = await firebaseHelper.getDocByField(busCollection, 'number', data.number);
    if (numberSnapshot.length) {
      return responseError(
        res,
        StatusCode.BUS_NUMBER_ALREADY_EXISTS,
        ErrorMessage.BUS_NUMBER_ALREADY_EXISTS,
      );
    }

    const codeSnapshot = await firebaseHelper.getDocByField(
      busCollection,
      'plate_number',
      data.plate_number,
    );
    if (codeSnapshot.length) {
      return responseError(
        res,
        StatusCode.BUS_CODE_ALREADY_EXISTS,
        ErrorMessage.BUS_CODE_ALREADY_EXISTS,
      );
    }

    const files = req?.files as Express.Multer.File[];
    const busData = {
      ...data,
      status: BusStatus.ACTIVE,
      seats: generateSeats(data.capacity),
      image_urls: files?.map((file) => file.path.replace(/\\/g, '/')) || [],
      created_by: req.user?.uid,
    };
    const docRef = await firebaseHelper.createDoc(busCollection, busData);

    return responseSuccess(res, Message.BUS_CREATED, { id: docRef.id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_CREATE_BUS + error);

    return responseError(res, StatusCode.BUS_CREATE, ErrorMessage.CANNOT_CREATE_BUS);
  }
};

export const getAllBuses = async (req: AuthRequest, res: Response) => {
  try {
    const { status, plate_number, order, order_by } = req.query;
    const { page, page_size } = req.pagination ?? {};
    const filters: { field: string; operator: WhereFilterOp; value: any }[] = [];
    if (plate_number) {
      const capitalizedName = capitalizeName(plate_number as string);
      filters.push(
        { field: 'plate_number', operator: '>=', value: capitalizedName },
        { field: 'plate_number', operator: '<=', value: capitalizedName + '\uf8ff' },
      );
    }

    if (status) {
      filters.push({ field: 'status', operator: '==', value: status });
    }

    const total = filters.length
      ? await firebaseHelper.countDocsByFields(busCollection, filters)
      : await firebaseHelper.countAllDocs(busCollection);
    const totalPage = page_size
      ? Math.max(DEFAULT_PAGE_TOTAL, Math.ceil(total / page_size))
      : DEFAULT_PAGE_TOTAL;
    const orderBy = plate_number ? 'plate_number' : (order_by as string);
    const orderDirection = order as OrderByDirection;
    let buses: Bus[];
    if (filters.length) {
      buses = await firebaseHelper.getDocsByFields(
        busCollection,
        filters,
        orderBy,
        orderDirection,
        page,
        page_size,
      );
    } else {
      buses = await firebaseHelper.getAllDocs(
        busCollection,
        orderBy,
        orderDirection,
        page,
        page_size,
      );
    }

    if (!buses.length) {
      return responseSuccess(res, Message.NO_BUS_DATA, buses);
    }

    return responseSuccess(res, Message.BUS_GET_ALL, {
      buses,
      pagination: {
        page,
        page_size,
        total,
        total_page: totalPage,
      },
    });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_BUS_LIST + error);

    return responseError(res, StatusCode.BUS_GET_ALL, ErrorMessage.CANNOT_GET_BUS_LIST);
  }
};

export const getBusStats = async (req: AuthRequest, res: Response) => {
  try {
    const facilities = await firebaseHelper.getDocsWithFields(busCollection, [
      'status',
      'driver_id',
    ]);
    const total = facilities.length;
    const stats = facilities.reduce(
      (acc, bus) => {
        switch (bus.status) {
          case BusStatus.ACTIVE:
            acc.active++;
            break;
          case BusStatus.INACTIVE:
            acc.inactive++;
            break;
          case BusStatus.MAINTENANCE:
            acc.maintenance++;
            break;
        }

        if (bus.driver_id) {
          acc.driverSet.add(bus.driver_id);
        }

        return acc;
      },
      {
        active: 0,
        maintenance: 0,
        inactive: 0,
        driverSet: new Set<string>(),
      },
    );

    const drivers = Array.from(stats.driverSet);
    return responseSuccess(res, Message.BUS_GET_STATS, {
      total,
      active: stats.active,
      maintenance: stats.maintenance,
      inactive: stats.inactive,
      drivers,
    });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_BUS_STATS} | ${error}`);

    return responseError(res, StatusCode.CANNOT_GET_BUS_STATS, ErrorMessage.CANNOT_GET_BUS_STATS);
  }
};

export const getBusDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const bus = await firebaseHelper.getDocById(busCollection, id);
    if (!bus) {
      return responseError(res, StatusCode.BUS_NOT_FOUND, ErrorMessage.BUS_NOT_FOUND);
    }

    return responseSuccess(res, Message.BUS_GET_DETAIL, bus);
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_GET_BUS_DETAIL + error);

    return responseError(res, StatusCode.BUS_GET_DETAIL, ErrorMessage.CANNOT_GET_BUS_DETAIL);
  }
};

export const updateBus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: Partial<Bus> = req.body;

    const existingBus = await firebaseHelper.getDocById(busCollection, id);
    if (!existingBus) {
      return responseError(res, StatusCode.BUS_NOT_FOUND, ErrorMessage.BUS_NOT_FOUND);
    }

    if (data.number && data.number !== existingBus.number) {
      const numberSnapshot = await firebaseHelper.getDocByField(
        busCollection,
        'number',
        data.number,
      );
      if (numberSnapshot.length) {
        return responseError(
          res,
          StatusCode.BUS_NUMBER_ALREADY_EXISTS,
          ErrorMessage.BUS_NUMBER_ALREADY_EXISTS,
        );
      }
    }

    if (data.plate_number && data.plate_number !== existingBus.code) {
      const codeSnapshot = await firebaseHelper.getDocByField(
        busCollection,
        'plate_number',
        data.plate_number,
      );
      if (codeSnapshot.length) {
        return responseError(
          res,
          StatusCode.BUS_CODE_ALREADY_EXISTS,
          ErrorMessage.BUS_CODE_ALREADY_EXISTS,
        );
      }
    }

    const files = req?.files as Express.Multer.File[];
    if (files?.length) {
      if (existingBus.image_urls?.length) {
        await deleteImages(existingBus.image_urls);
      }
      data.image_urls = files.map((file) => file.path.replace(/\\/g, '/'));
    }

    const capacity = data.capacity;
    await firebaseHelper.updateDoc(busCollection, id, {
      ...data,
      ...(capacity && {
        seats: generateSeats(capacity),
      }),
      updated_by: req.user?.uid,
    });

    return responseSuccess(res, Message.BUS_UPDATED, { id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_BUS + error);
    return responseError(res, StatusCode.BUS_UPDATE, ErrorMessage.CANNOT_UPDATE_BUS);
  }
};

export const updateBusStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await firebaseHelper.updateDoc(busCollection, id, {
      status: req.body.status,
    });

    return responseSuccess(res, Message.BUS_STATUS_UPDATED, { id });
  } catch (error) {
    logger.warn(ErrorMessage.CANNOT_UPDATE_BUS_STATUS + error);

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_BUS_STATUS,
      ErrorMessage.CANNOT_UPDATE_BUS_STATUS,
    );
  }
};
