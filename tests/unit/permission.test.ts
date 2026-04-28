import { StatusCode, ErrorMessage, Message } from '../../constants/message';
import { responseSuccess, responseError, firebaseHelper, logger } from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import {
  createPermission,
  getPermissionById,
  getPermissions,
  updatePermission,
} from './../../services/permission';
import { mockPermission, mockPermissions, mockUid } from '../data/permission.mock';
import { Sites, Collection } from '../../constants/enum';

const permissionCollection = `${Sites.TOKYO}/${Collection.PERMISSIONS}`;
const mockedFirebase = jest.mocked(firebaseHelper);
const mockedLogger = jest.mocked(logger);

describe('getPermissions()', () => {
  describe('valid case', () => {
    test('should return permissions successfully', async () => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.getAllDocs.mockResolvedValue(mockPermissions);
      const response = await getPermissions(req, res);

      expect(mockedFirebase.getAllDocs).toHaveBeenCalledWith(permissionCollection);
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.PERMISSION_GET_ALL,
        mockPermissions,
      );
      expect(response).toEqual({ success: true, data: mockPermissions });
    });
  });

  describe('error case', () => {
    test('should handle error when getAllDocs throws', async () => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.getAllDocs.mockRejectedValue(new Error('DB error'));
      const response = await getPermissions(req, res);

      expect(mockedFirebase.getAllDocs).toHaveBeenCalledWith(permissionCollection);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        ErrorMessage.CANNOT_GET_PERMISSION_LIST + 'Error: DB error',
      );
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.PERMISSION_GET_ALL,
        ErrorMessage.CANNOT_GET_PERMISSION_LIST,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.PERMISSION_GET_ALL,
        message: ErrorMessage.CANNOT_GET_PERMISSION_LIST,
      });
    });
  });
});

describe('getPermissionById()', () => {
  describe('valid case', () => {
    test('should return permission successfully', async () => {
      const req = mockReq({ params: { id: mockPermission.id } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockPermission);
      const response = await getPermissionById(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(
        permissionCollection,
        mockPermission.id,
      );
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.PERMISSION_GET_DETAIL,
        mockPermission,
      );
      expect(response).toEqual({ success: true, data: mockPermission });
    });
  });

  describe('error cases', () => {
    test('should return error when permission not found', async () => {
      const req = mockReq({ params: { id: mockPermission.id } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null);
      const response = await getPermissionById(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(
        permissionCollection,
        mockPermission.id,
      );
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.PERMISSION_NOT_FOUND,
        ErrorMessage.PERMISSION_NOT_FOUND,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.PERMISSION_NOT_FOUND,
        message: ErrorMessage.PERMISSION_NOT_FOUND,
      });
    });

    test('should handle error when getDocById throws', async () => {
      const req = mockReq({ params: { id: mockPermission.id } });
      const res = mockRes();

      mockedFirebase.getDocById.mockRejectedValue(new Error('DB error'));
      const response = await getPermissionById(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(
        permissionCollection,
        mockPermission.id,
      );
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        ErrorMessage.PERMISSION_GET_DETAIL + 'Error: DB error',
      );
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.PERMISSION_GET_DETAIL,
        ErrorMessage.PERMISSION_GET_DETAIL,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.PERMISSION_GET_DETAIL,
        message: ErrorMessage.PERMISSION_GET_DETAIL,
      });
    });
  });
});

describe('createPermission()', () => {
  describe('valid case', () => {
    test('should create permission successfully', async () => {
      const req = mockReq({ body: mockPermission, user: { uid: mockUid } });
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValueOnce([]);
      mockedFirebase.createDoc.mockResolvedValueOnce({ id: mockPermission.id } as any);
      const response = await createPermission(req, res);

      expect(mockedFirebase.getDocByField).toHaveBeenCalledWith(
        permissionCollection,
        'id',
        mockPermission.id,
      );
      expect(mockedFirebase.createDoc).toHaveBeenCalledWith(permissionCollection, {
        ...mockPermission,
        created_by: mockUid,
      });
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.PERMISSION_CREATED,
        mockPermission.id,
      );
      expect(response).toEqual({ success: true, data: mockPermission.id });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when permission already exists',
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValueOnce([mockPermission]);
        },
        error: {
          status: StatusCode.PERMISSION_ALREADY_EXISTS,
          message: ErrorMessage.PERMISSION_ALREADY_EXISTS,
        },
      },
      {
        name: 'should handle error when getDocByField throws',
        mockFire: () => {
          mockedFirebase.getDocByField.mockRejectedValue(new Error('DB error'));
        },
        error: {
          status: StatusCode.PERMISSION_CREATE,
          message: ErrorMessage.CANNOT_CREATE_PERMISSION,
        },
      },
      {
        name: 'should handle error when createDoc throws',
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValueOnce([]);
          mockedFirebase.createDoc.mockRejectedValue(new Error('DB error'));
        },
        error: {
          status: StatusCode.PERMISSION_CREATE,
          message: ErrorMessage.CANNOT_CREATE_PERMISSION,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq({ body: mockPermission, user: { uid: mockUid } });
      const res = mockRes();

      mockFire();
      const response = await createPermission(req, res);

      expect(responseError).toHaveBeenCalledWith(res, error.status, error.message);
      expect(response).toEqual({ success: false, status: error.status, message: error.message });
    });
  });
});

describe('updatePermission()', () => {
  describe('valid case', () => {
    test('should update permission successfully', async () => {
      const req = mockReq({
        params: { id: mockPermission.id },
        body: { description: 'updated desc' },
        user: { uid: mockUid },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockPermission);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
      const response = await updatePermission(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(
        permissionCollection,
        mockPermission.id,
      );
      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        permissionCollection,
        mockPermission.id,
        {
          description: 'updated desc',
          updated_by: mockUid,
        },
      );
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.PERMISSION_UPDATED,
        mockPermission.id,
      );
      expect(response).toEqual({
        success: true,
        data: mockPermission.id,
      });
    });
  });

  describe('error cases', () => {
    test('should return error when permission not found', async () => {
      const req = mockReq({
        params: { id: mockPermission.id },
        body: { description: 'updated desc' },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null);
      const response = await updatePermission(req, res);

      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.PERMISSION_NOT_FOUND,
        ErrorMessage.PERMISSION_NOT_FOUND,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.PERMISSION_NOT_FOUND,
        message: ErrorMessage.PERMISSION_NOT_FOUND,
      });
    });

    test('should handle error when updateDoc throws', async () => {
      const req = mockReq({
        params: { id: mockPermission.id },
        body: { description: 'updated desc' },
        user: { uid: mockUid },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockPermission);
      mockedFirebase.updateDoc.mockRejectedValue(new Error('DB error'));

      const response = await updatePermission(req, res);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        ErrorMessage.CANNOT_UPDATE_PERMISSION + 'Error: DB error',
      );
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.PERMISSION_UPDATE,
        ErrorMessage.CANNOT_UPDATE_PERMISSION,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.PERMISSION_UPDATE,
        message: ErrorMessage.CANNOT_UPDATE_PERMISSION,
      });
    });
  });
});
