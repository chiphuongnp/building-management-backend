import { Request, Response } from 'express';
import {
  firebaseHelper,
  logger,
  deleteImages,
  responseError,
  responseSuccess,
  admin,
  capitalizeName,
} from '../utils/index';
import { ActiveStatus, Collection, Permission, Sites, UserRole, UserRank } from '../constants/enum';
import { ErrorMessage, Message, StatusCode } from '../constants/message';
import { AuthRequest } from '../interfaces/jwt';
import { User } from '../interfaces/user';
import { OrderByDirection, WhereFilterOp } from 'firebase-admin/firestore';
import { DEFAULT_AVATAR_URL, DEFAULT_PAGE_TOTAL } from '../constants/constant';
import * as ENV from '../configs/envConfig';

const userCollection = `${Sites.TOKYO}/${Collection.USERS}`;
const getTokenPath = (uid: string) => {
  const tokenPath = `${userCollection}/${uid}/tokens`;

  return { tokenPath };
};

export const getAllUser = async (req: AuthRequest, res: Response) => {
  try {
    const { page, page_size: pageSize } = req.pagination ?? {};
    const { search_text, search_field, status, role, rank, order, order_by } = req.query;
    const filters: { field: string; operator: WhereFilterOp; value: any }[] = [];
    if (search_text && search_field == 'full_name') {
      const capitalizedName = capitalizeName(search_text as string);
      filters.push(
        { field: 'full_name', operator: '>=', value: capitalizedName },
        { field: 'full_name', operator: '<=', value: capitalizedName + '\uf8ff' },
      );
    }

    if (search_text && search_field == 'email') {
      filters.push(
        { field: 'email', operator: '>=', value: search_text },
        { field: 'email', operator: '<=', value: search_text + '\uf8ff' },
      );
    }

    if (role) {
      filters.push({ field: 'role', operator: '==', value: role });
    }

    if (rank) {
      filters.push({ field: 'rank', operator: '==', value: rank });
    }

    if (status) {
      filters.push({ field: 'status', operator: '==', value: status });
    }

    const total = filters.length
      ? await firebaseHelper.countDocsByFields(userCollection, filters)
      : await firebaseHelper.countAllDocs(userCollection);
    const totalPage = pageSize
      ? Math.max(DEFAULT_PAGE_TOTAL, Math.ceil(total / pageSize))
      : DEFAULT_PAGE_TOTAL;
    const orderBy = search_text && search_field ? (search_field as string) : (order_by as string);
    const orderDirection = order as OrderByDirection;

    let users: User[];
    if (filters.length) {
      users = await firebaseHelper.getDocsByFields(
        userCollection,
        filters,
        orderBy,
        orderDirection,
        page,
        pageSize,
      );
    } else {
      users = await firebaseHelper.getAllDocs(
        userCollection,
        orderBy,
        orderDirection,
        page,
        pageSize,
      );
    }

    return responseSuccess(res, Message.USER_GET_ALL, {
      users,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_page: totalPage,
      },
    });
  } catch (error) {
    logger.warn(`${ErrorMessage.USER_GET_ALL} | ${error}`);

    return responseError(res, StatusCode.USER_GET_ALL, ErrorMessage.REQUEST_FAILED);
  }
};

export const getUsersStats = async (_req: AuthRequest, res: Response) => {
  try {
    const users: User[] = await firebaseHelper.getDocsWithFields(userCollection, ['role', 'rank']);
    const total = users.length;
    const stats = users.reduce(
      (acc, user) => {
        if (user.role) {
          acc.roles[user.role] = (acc.roles[user.role] || 0) + 1;
        }

        if (user.rank) {
          acc.ranks[user.rank] = (acc.ranks[user.rank] || 0) + 1;
        }

        return acc;
      },
      {
        roles: {} as Record<string, number>,
        ranks: {} as Record<string, number>,
      },
    );

    return responseSuccess(res, Message.USER_GET_STATS, {
      total,
      roles: stats.roles,
      ranks: stats.ranks,
    });
  } catch (error) {
    logger.warn(`${ErrorMessage.CANNOT_GET_USER_STATS} | ${error}`);

    return responseError(res, StatusCode.CANNOT_GET_USER_STATS, ErrorMessage.CANNOT_GET_USER_STATS);
  }
};

export const getUserDetail = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const userDetail = await firebaseHelper.getDocById(userCollection, userId);
    if (!userDetail) {
      return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);
    }

    return responseSuccess(res, Message.USER_GET_DETAIL, userDetail);
  } catch (error) {
    logger.warn(ErrorMessage.USER_GET_DETAIL + error);
    return responseError(res, StatusCode.USER_GET_DETAIL, ErrorMessage.USER_GET_DETAIL);
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;
  if (!uid) {
    return responseError(res, StatusCode.ACCOUNT_NOT_FOUND, ErrorMessage.ACCOUNT_NOT_FOUND);
  }

  try {
    const profile = await firebaseHelper.getDocById(userCollection, uid);
    if (!profile) {
      return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);
    }

    return responseSuccess(res, Message.USER_GET_PROFILE, profile);
  } catch (error) {
    logger.warn(ErrorMessage.USER_GET_PROFILE + error);
    return responseError(res, StatusCode.USER_GET_PROFILE, ErrorMessage.USER_GET_PROFILE);
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid!;
    const user: User = await firebaseHelper.getDocById(userCollection, userId);
    if (!user) {
      return responseError(res, StatusCode.USER_NOT_FOUND, ErrorMessage.USER_NOT_FOUND);
    }

    const file = req.file as Express.Multer.File | undefined;
    const newImageUrl = file ? file.path.replace(/\\/g, '/') : null;
    if (newImageUrl && user.image_url) {
      await deleteImages([user.image_url]);
    }

    const updatedUser: User = {
      ...req.body,
      image_url: newImageUrl ? newImageUrl : user.image_url,
      updated_by: req.user?.uid,
    };
    await firebaseHelper.updateDoc(userCollection, userId, updatedUser);

    return responseSuccess(res, Message.USER_UPDATED, userId);
  } catch (error) {
    logger.warn(ErrorMessage.USER_UPDATED + error);

    return responseError(res, StatusCode.USER_UPDATE, ErrorMessage.REQUEST_FAILED);
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, username, full_name: fullName, phone, role, permissions } = req.body;
    const users: User[] = await firebaseHelper.getDocByField(userCollection, 'email', email);
    if (users.length) {
      return responseError(res, StatusCode.ACCOUNT_EMAIL_EXISTS, ErrorMessage.ACCOUNT_EMAIL_EXISTS);
    }

    const authUser = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
    });
    const uid = authUser.uid;
    const userData: User = {
      id: uid,
      email,
      username,
      phone,
      role: role ? role : UserRole.USER,
      permissions: role === UserRole.MANAGER ? permissions : [],
      full_name: fullName,
      image_url: DEFAULT_AVATAR_URL,
      rank: UserRank.BRONZE,
      points: 0,
      status: ActiveStatus.ACTIVE,
      created_by: req.user?.uid,
    };

    const result = await firebaseHelper.createDoc(userCollection, userData);
    if (!result) {
      return responseError(res, StatusCode.CANNOT_CREATE_USER, ErrorMessage.CANNOT_CREATE_USER);
    }

    return responseSuccess(res, Message.USER_CREATED, userData);
  } catch (err: any) {
    logger.warn(`${ErrorMessage.CANNOT_CREATE_USER} | ${err}`);

    if (err.code?.startsWith('auth/')) {
      return responseError(
        res,
        StatusCode.FIREBASE_AUTH_FAILED,
        `${ErrorMessage.FIREBASE_AUTH_FAILED} | ${err.message}`,
      );
    }

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_USER,
      `${ErrorMessage.CANNOT_CREATE_USER} | ${err.message}`,
    );
  }
};

export const createSuperManager = async (req: Request, res: Response) => {
  try {
    const { email, password, username, full_name: fullName, phone } = req.body;
    const secret = req.headers['x-init-secret'];
    if (secret !== ENV.INIT_MANAGER_SECRET) {
      return responseError(res, StatusCode.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED);
    }

    const users: User[] = await firebaseHelper.getDocByField(
      userCollection,
      'role',
      UserRole.MANAGER,
    );
    if (users.length) {
      return responseError(res, StatusCode.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED);
    }

    const authUser = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
    });
    const uid = authUser.uid;
    const userData = {
      id: uid,
      email,
      username,
      phone,
      full_name: fullName,
      role: UserRole.MANAGER,
      permissions: [Permission.CREATE_USER],
      image_url: DEFAULT_AVATAR_URL,
      rank: UserRank.BRONZE,
      points: 0,
      status: ActiveStatus.ACTIVE,
    };

    const result = await firebaseHelper.createDoc(userCollection, userData);
    if (!result) {
      return responseError(res, StatusCode.CANNOT_CREATE_USER, ErrorMessage.CANNOT_CREATE_USER);
    }

    return responseSuccess(res, Message.SUPER_MANAGER_CREATED, userData);
  } catch (err: any) {
    logger.warn(`${ErrorMessage.CANNOT_CREATE_SUPER_MANAGER} | ${err}`);

    if (err.code?.startsWith('auth/')) {
      return responseError(
        res,
        StatusCode.FIREBASE_AUTH_FAILED,
        `${ErrorMessage.FIREBASE_AUTH_FAILED} | ${err.message}`,
      );
    }

    return responseError(
      res,
      StatusCode.CANNOT_CREATE_SUPER_MANAGER,
      `${ErrorMessage.CANNOT_CREATE_SUPER_MANAGER} | ${err.message}`,
    );
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;
    const uid = req.user?.uid!;
    await admin.auth().updateUser(uid, { password });
    await admin.auth().revokeRefreshTokens(uid);

    const { tokenPath } = getTokenPath(uid);
    const tokens = await firebaseHelper.getDocsByFields(tokenPath, [
      { field: 'revoked', operator: '==', value: false },
    ]);
    await firebaseHelper.updateBatchDocs(
      tokenPath,
      tokens.map((t) => ({
        ...t,
        revoked: true,
      })),
    );

    return responseSuccess(res, Message.PASSWORD_UPDATED, { id: uid });
  } catch (err: any) {
    logger.warn(`${ErrorMessage.CANNOT_UPDATE_PASSWORD} | ${err}`);

    if (err.code?.startsWith('auth/')) {
      return responseError(
        res,
        StatusCode.FIREBASE_AUTH_FAILED,
        `${ErrorMessage.FIREBASE_AUTH_FAILED} | ${err.message}`,
      );
    }

    return responseError(
      res,
      StatusCode.CANNOT_UPDATE_PASSWORD,
      `${ErrorMessage.CANNOT_UPDATE_PASSWORD} | ${err.message}`,
    );
  }
};
