import {
  createSuperManager,
  createUser,
  getAllUser,
  getProfile,
  getUserDetail,
  getUsersStats,
  updatePassword,
  updateUser,
  updateUserPermissions,
} from './../../services/user';
import { StatusCode, ErrorMessage, Message } from '../../constants/message';
import {
  capitalizeName,
  deleteImages,
  firebaseHelper,
  logger,
  responseError,
  responseSuccess,
} from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import {
  mockCreateUserBody,
  mockFilteredUsers,
  mockTokens,
  mockUid,
  mockUser,
  mockUsers,
  mockUsersData,
} from '../data/user.mock';
import {
  UserRole,
  UserRank,
  ActiveStatus,
  Collection,
  Sites,
  Permission,
} from '../../constants/enum';
import { createUserMock, revokeRefreshTokensMock, updateUserMock } from '../helpers/utilMock';
import { DEFAULT_AVATAR_URL } from '../../constants/constant';
import * as ENV from '../../configs/envConfig';
import permissionSeed from '../../seeds/permissions.json';

const mockedFirebase = jest.mocked(firebaseHelper);
const mockedLogger = jest.mocked(logger);
const userCollection = `${Sites.TOKYO}/${Collection.USERS}`;

describe('getAllUser()', () => {
  describe('valid cases', () => {
    test('should return all users when no filter', async () => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(2);
      mockedFirebase.getAllDocs.mockResolvedValue(mockUsers);
      const response = await getAllUser(req, res);

      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.USER_GET_ALL,
        expect.objectContaining({
          users: mockUsers,
          pagination: expect.objectContaining({
            page: 1,
            page_size: 10,
            total: 2,
            total_page: 1,
          }),
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          users: mockUsers,
          pagination: expect.objectContaining({
            page: 1,
            page_size: 10,
            total: 2,
            total_page: 1,
          }),
        }),
      });
    });

    const filteredCases = [
      {
        name: 'should filter by full_name',
        query: { search_text: 'john', search_field: 'full_name' },
        expected: {
          filters: [
            {
              field: 'full_name',
              operator: '>=',
              value: capitalizeName('john'),
            },
            {
              field: 'full_name',
              operator: '<=',
              value: capitalizeName('john') + '\uf8ff',
            },
          ],
          orderBy: 'full_name',
        },
      },
      {
        name: 'should filter by email',
        query: { search_text: 'test@gmail.com', search_field: 'email' },
        expected: {
          filters: [
            { field: 'email', operator: '>=', value: 'test@gmail.com' },
            { field: 'email', operator: '<=', value: 'test@gmail.com\uf8ff' },
          ],
          orderBy: 'email',
        },
      },
      {
        name: 'should filter by role',
        query: { role: UserRole.MANAGER },
        expected: {
          filters: [{ field: 'role', operator: '==', value: UserRole.MANAGER }],
          orderBy: undefined,
        },
      },
      {
        name: 'should filter by rank',
        query: { rank: UserRank.GOLD },
        expected: {
          filters: [{ field: 'rank', operator: '==', value: UserRank.GOLD }],
          orderBy: undefined,
        },
      },
      {
        name: 'should filter by status',
        query: { status: ActiveStatus.ACTIVE },
        expected: {
          filters: [{ field: 'status', operator: '==', value: ActiveStatus.ACTIVE }],
          orderBy: undefined,
        },
      },
      {
        name: 'should filter by role, rank, status',
        query: {
          role: UserRole.MANAGER,
          rank: UserRank.GOLD,
          status: ActiveStatus.ACTIVE,
        },
        expected: {
          filters: [
            { field: 'role', operator: '==', value: UserRole.MANAGER },
            { field: 'rank', operator: '==', value: UserRank.GOLD },
            { field: 'status', operator: '==', value: ActiveStatus.ACTIVE },
          ],
          orderBy: undefined,
        },
      },
      {
        name: 'should filter by full_name + rank',
        query: {
          search_text: 'john',
          search_field: 'full_name',
          rank: UserRank.GOLD,
        },
        expected: {
          filters: [
            {
              field: 'full_name',
              operator: '>=',
              value: capitalizeName('john'),
            },
            {
              field: 'full_name',
              operator: '<=',
              value: capitalizeName('john') + '\uf8ff',
            },
            {
              field: 'rank',
              operator: '==',
              value: UserRank.GOLD,
            },
          ],
          orderBy: 'full_name',
        },
      },
      {
        name: 'should filter by email + status + role',
        query: {
          search_text: 'test@gmail.com',
          search_field: 'email',
          status: ActiveStatus.ACTIVE,
          role: UserRole.MANAGER,
        },
        expected: {
          filters: [
            { field: 'email', operator: '>=', value: 'test@gmail.com' },
            { field: 'email', operator: '<=', value: 'test@gmail.com\uf8ff' },
            { field: 'role', operator: '==', value: UserRole.MANAGER },
            { field: 'status', operator: '==', value: ActiveStatus.ACTIVE },
          ],
          orderBy: 'email',
        },
      },
      {
        name: 'should ignore search_text when undefined search_field',
        query: {
          search_text: 'john',
          role: UserRole.MANAGER,
        },
        expected: {
          filters: [{ field: 'role', operator: '==', value: UserRole.MANAGER }],
          orderBy: undefined,
        },
      },
      {
        name: 'should ignore search_field when undefined search_text',
        query: {
          search_field: 'name',
          rank: UserRank.GOLD,
          status: ActiveStatus.ACTIVE,
        },
        expected: {
          filters: [
            { field: 'rank', operator: '==', value: UserRank.GOLD },
            { field: 'status', operator: '==', value: ActiveStatus.ACTIVE },
          ],
          orderBy: undefined,
        },
      },
      {
        name: 'should ignore order_by when search_field exists',
        query: {
          search_text: 'john',
          search_field: 'full_name',
          order_by: 'created_at',
        },
        expected: {
          filters: [
            {
              field: 'full_name',
              operator: '>=',
              value: capitalizeName('john'),
            },
            {
              field: 'full_name',
              operator: '<=',
              value: capitalizeName('john') + '\uf8ff',
            },
          ],
          orderBy: 'full_name',
        },
      },
    ];

    test.each(filteredCases)('$name', async ({ query, expected }) => {
      const req = mockReq({ query });
      const res = mockRes();

      mockedFirebase.countDocsByFields.mockResolvedValue(1);
      mockedFirebase.getDocsByFields.mockResolvedValue(mockFilteredUsers);
      const response = await getAllUser(req, res);

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalled();

      const call = mockedFirebase.getDocsByFields.mock.calls[0];
      expect(call[1]).toEqual(expected.filters);
      expect(call[2]).toBe(expected.orderBy);
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.USER_GET_ALL,
        expect.objectContaining({
          users: mockFilteredUsers,
          pagination: expect.objectContaining({
            total: 1,
          }),
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          users: mockFilteredUsers,
          pagination: expect.objectContaining({
            total: 1,
          }),
        }),
      });
    });

    test.each([
      {
        name: 'only search_text',
        query: { search_text: 'john' },
      },
      {
        name: 'only search_field',
        query: { search_field: 'full_name' },
      },
    ])('should fallback to getAllDocs when $name', async ({ query }) => {
      const req = mockReq({ query });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(1);
      mockedFirebase.getAllDocs.mockResolvedValue([]);

      await getAllUser(req, res);

      expect(mockedFirebase.getAllDocs).toHaveBeenCalled();
      expect(mockedFirebase.getDocsByFields).not.toHaveBeenCalled();
    });

    test('should return paginated users', async () => {
      const req = mockReq({ query: {}, pagination: { page: 2, page_size: 5 } });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(20);
      mockedFirebase.getAllDocs.mockResolvedValue(mockUsers);
      const response = await getAllUser(req, res);

      expect(mockedFirebase.getAllDocs).toHaveBeenCalledWith(
        userCollection,
        undefined,
        undefined,
        2,
        5,
      );
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.USER_GET_ALL,
        expect.objectContaining({
          users: mockUsers,
          pagination: expect.objectContaining({
            page: 2,
            page_size: 5,
            total: 20,
            total_page: 4,
          }),
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          users: mockUsers,
          pagination: expect.objectContaining({
            page: 2,
            page_size: 5,
            total: 20,
            total_page: 4,
          }),
        }),
      });
    });

    test('should handle search + pagination together', async () => {
      const req = mockReq({
        query: {
          search_text: 'john',
          search_field: 'full_name',
        },
        pagination: {
          page: 2,
          page_size: 5,
        },
      });
      const res = mockRes();

      mockedFirebase.countDocsByFields.mockResolvedValue(10);
      mockedFirebase.getDocsByFields.mockResolvedValue(mockFilteredUsers);
      const response = await getAllUser(req, res);

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(
        userCollection,
        expect.arrayContaining([
          {
            field: 'full_name',
            operator: '>=',
            value: capitalizeName('john'),
          },
          {
            field: 'full_name',
            operator: '<=',
            value: capitalizeName('john') + '\uf8ff',
          },
        ]),
        'full_name',
        undefined,
        2,
        5,
      );
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.USER_GET_ALL,
        expect.objectContaining({
          users: mockFilteredUsers,
          pagination: expect.objectContaining({
            page: 2,
            page_size: 5,
            total: 10,
            total_page: 2,
          }),
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          users: mockFilteredUsers,
          pagination: expect.objectContaining({
            page: 2,
            page_size: 5,
            total: 10,
            total_page: 2,
          }),
        }),
      });
    });

    test('should handle multi-filter with pagination', async () => {
      const req = mockReq({
        query: {
          role: UserRole.MANAGER,
          rank: UserRank.GOLD,
          status: ActiveStatus.ACTIVE,
        },
        pagination: {
          page: 1,
          page_size: 10,
        },
      });
      const res = mockRes();

      mockedFirebase.countDocsByFields.mockResolvedValue(30);
      mockedFirebase.getDocsByFields.mockResolvedValue(mockFilteredUsers);
      const response = await getAllUser(req, res);

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(
        userCollection,
        expect.arrayContaining([
          { field: 'role', operator: '==', value: UserRole.MANAGER },
          { field: 'rank', operator: '==', value: UserRank.GOLD },
          { field: 'status', operator: '==', value: ActiveStatus.ACTIVE },
        ]),
        undefined,
        undefined,
        1,
        10,
      );
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.USER_GET_ALL,
        expect.objectContaining({
          users: mockFilteredUsers,
          pagination: expect.objectContaining({
            page: 1,
            page_size: 10,
            total: 30,
            total_page: 3,
          }),
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          users: mockFilteredUsers,
          pagination: expect.objectContaining({
            page: 1,
            page_size: 10,
            total: 30,
            total_page: 3,
          }),
        }),
      });
    });

    test('should handle search + multi-filter + pagination together', async () => {
      const req = mockReq({
        query: {
          search_text: 'john',
          search_field: 'full_name',
          role: UserRole.MANAGER,
          rank: UserRank.GOLD,
          status: ActiveStatus.ACTIVE,
        },
        pagination: {
          page: 2,
          page_size: 5,
        },
      });
      const res = mockRes();

      mockedFirebase.countDocsByFields.mockResolvedValue(50);
      mockedFirebase.getDocsByFields.mockResolvedValue(mockFilteredUsers);
      const response = await getAllUser(req, res);

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(
        userCollection,
        expect.arrayContaining([
          expect.objectContaining({ field: 'full_name' }),
          { field: 'role', operator: '==', value: UserRole.MANAGER },
          { field: 'rank', operator: '==', value: UserRank.GOLD },
          { field: 'status', operator: '==', value: ActiveStatus.ACTIVE },
        ]),
        'full_name',
        undefined,
        2,
        5,
      );
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.USER_GET_ALL,
        expect.objectContaining({
          users: mockFilteredUsers,
          pagination: expect.objectContaining({
            page: 2,
            page_size: 5,
            total: 50,
            total_page: 10,
          }),
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          users: mockFilteredUsers,
          pagination: expect.objectContaining({
            page: 2,
            page_size: 5,
            total: 50,
            total_page: 10,
          }),
        }),
      });
    });

    test('should override order_by when search exists but keep order direction', async () => {
      const req = mockReq({
        query: {
          search_text: 'john',
          search_field: 'full_name',
          order_by: 'created_at',
          order: 'desc',
        },
      });
      const res = mockRes();

      mockedFirebase.countDocsByFields.mockResolvedValue(5);
      mockedFirebase.getDocsByFields.mockResolvedValue(mockFilteredUsers);
      const response = await getAllUser(req, res);

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(
        userCollection,
        expect.any(Array),
        'full_name',
        'desc',
        1,
        10,
      );
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.USER_GET_ALL,
        expect.objectContaining({
          users: mockFilteredUsers,
          pagination: expect.objectContaining({
            total: 5,
          }),
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          users: mockFilteredUsers,
          pagination: expect.objectContaining({
            total: 5,
          }),
        }),
      });
    });

    test('should apply order even when order_by is undefined', async () => {
      const req = mockReq({ query: { order: 'desc' } });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(5);
      mockedFirebase.getAllDocs.mockResolvedValue(mockUsers);
      const response = await getAllUser(req, res);

      expect(mockedFirebase.getAllDocs).toHaveBeenCalledWith(
        userCollection,
        undefined,
        'desc',
        1,
        10,
      );
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.USER_GET_ALL,
        expect.objectContaining({
          users: mockUsers,
          pagination: expect.objectContaining({
            page: 1,
            page_size: 10,
            total: 5,
            total_page: 1,
          }),
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          users: mockUsers,
          pagination: expect.objectContaining({
            page: 1,
            page_size: 10,
            total: 5,
            total_page: 1,
          }),
        }),
      });
    });

    test('should handle sorting with pagination', async () => {
      const req = mockReq({
        query: {
          order_by: 'created_at',
          order: 'desc',
        },
        pagination: {
          page: 3,
          page_size: 20,
        },
      });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(100);
      mockedFirebase.getAllDocs.mockResolvedValue(mockUsers);
      const response = await getAllUser(req, res);

      expect(mockedFirebase.getAllDocs).toHaveBeenCalledWith(
        userCollection,
        'created_at',
        'desc',
        3,
        20,
      );
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.USER_GET_ALL,
        expect.objectContaining({
          users: mockUsers,
          pagination: expect.objectContaining({
            page: 3,
            page_size: 20,
            total: 100,
            total_page: 5,
          }),
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          users: mockUsers,
          pagination: expect.objectContaining({
            page: 3,
            page_size: 20,
            total: 100,
            total_page: 5,
          }),
        }),
      });
    });

    test('should ignore invalid search_field and use getDocsByFields', async () => {
      const req = mockReq({
        query: {
          search_text: 'john',
          search_field: 'invalid_field',
          role: UserRole.MANAGER,
        },
        pagination: {
          page: 1,
          page_size: 10,
        },
      });
      const res = mockRes();

      mockedFirebase.countDocsByFields.mockResolvedValue(1);
      mockedFirebase.getDocsByFields.mockResolvedValue(mockUsers);
      const response = await getAllUser(req, res);

      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(
        userCollection,
        [{ field: 'role', operator: '==', value: UserRole.MANAGER }],
        'invalid_field',
        undefined,
        1,
        10,
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          users: mockUsers,
          pagination: expect.objectContaining({
            page: 1,
            page_size: 10,
            total: 1,
          }),
        }),
      });
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.USER_GET_ALL,
        expect.objectContaining({
          users: mockUsers,
        }),
      );
    });
  });

  describe('edge cases', () => {
    test('should return empty result when no users found', async () => {
      const req = mockReq({ query: { search_text: 'notfound', search_field: 'email' } });
      const res = mockRes();

      mockedFirebase.countDocsByFields.mockResolvedValue(0);
      mockedFirebase.getDocsByFields.mockResolvedValue([]);

      const response = await getAllUser(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          users: [],
          pagination: expect.objectContaining({
            total: 0,
          }),
        }),
      });
    });

    test('should return empty result when no users found (no filter)', async () => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(0);
      mockedFirebase.getAllDocs.mockResolvedValue([]);
      const response = await getAllUser(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          users: [],
          pagination: expect.objectContaining({
            total: 0,
          }),
        }),
      });
    });

    test('should return empty users but still correct pagination', async () => {
      const req = mockReq({
        query: {
          search_text: 'notfound',
          search_field: 'email',
        },
        pagination: {
          page: 1,
          page_size: 10,
        },
      });
      const res = mockRes();

      mockedFirebase.countDocsByFields.mockResolvedValue(0);
      mockedFirebase.getDocsByFields.mockResolvedValue([]);
      const response = await getAllUser(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          users: [],
          pagination: expect.objectContaining({
            total: 0,
            page: 1,
            page_size: 10,
          }),
        }),
      });
    });

    test('should use undefined page and page_size when pagination is undefined', async () => {
      const req = mockReq({});
      const res = mockRes();
      req.pagination = undefined;

      mockedFirebase.countAllDocs.mockResolvedValue(2);
      mockedFirebase.getAllDocs.mockResolvedValue(mockUsers);
      const response = await getAllUser(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          users: mockUsers,
          pagination: expect.objectContaining({
            page: undefined,
            page_size: undefined,
            total: 2,
          }),
        }),
      });
    });

    test('should use DEFAULT_PAGE_TOTAL when page_size is undefined', async () => {
      const req = mockReq({ query: {}, pagination: { page: 1, page_size: undefined } });
      const res = mockRes();

      mockedFirebase.countAllDocs.mockResolvedValue(10);
      mockedFirebase.getAllDocs.mockResolvedValue([{ id: '1' }]);
      const response = await getAllUser(req, res);

      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          pagination: expect.objectContaining({
            page: 1,
            page_size: undefined,
            total_page: 1,
          }),
        }),
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when getDocsByFields fails',
        input: {
          query: {
            search_text: 'john',
            search_field: 'full_name',
          },
        },
        mockFire: () => {
          mockedFirebase.countDocsByFields.mockResolvedValue(10);
          mockedFirebase.getDocsByFields.mockRejectedValue(new Error('firebase error'));
        },
      },
      {
        name: 'should return error when getAllDocs fails',
        input: {
          query: {},
        },
        mockFire: () => {
          mockedFirebase.countAllDocs.mockResolvedValue(10);
          mockedFirebase.getAllDocs.mockRejectedValue(new Error('firebase error'));
        },
      },
      {
        name: 'should return error when countDocsByFields fails',
        input: {
          query: {
            role: UserRole.MANAGER,
          },
        },
        mockFire: () => {
          mockedFirebase.countDocsByFields.mockRejectedValue(new Error('firebase error'));
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();
      const response = await getAllUser(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.USER_GET_ALL,
        ErrorMessage.REQUEST_FAILED,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.USER_GET_ALL,
        message: ErrorMessage.REQUEST_FAILED,
      });
    });
  });
});

describe('getUsersStats()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should aggregate roles and ranks correctly with full data',
        input: [...mockUsersData],
        expected: {
          total: 4,
          roles: { [UserRole.MANAGER]: 2, [UserRole.USER]: 2 },
          ranks: { [UserRank.GOLD]: 3, [UserRank.SILVER]: 1 },
        },
      },
      {
        name: 'should ignore users missing role or rank fields',
        input: [...mockUsersData, { role: UserRole.MANAGER }, { rank: UserRank.GOLD }],
        expected: {
          total: 6,
          roles: { [UserRole.MANAGER]: 3, [UserRole.USER]: 2 },
          ranks: { [UserRank.GOLD]: 4, [UserRank.SILVER]: 1 },
        },
      },
      {
        name: 'should ignore null or undefined role and rank values',
        input: [
          ...mockUsersData,
          { role: null, rank: UserRank.GOLD },
          { role: UserRole.USER, rank: undefined },
        ],
        expected: {
          total: 6,
          roles: { [UserRole.MANAGER]: 2, [UserRole.USER]: 3 },
          ranks: { [UserRank.GOLD]: 4, [UserRank.SILVER]: 1 },
        },
      },
      {
        name: 'should return empty stats when no users',
        input: [],
        expected: { total: 0, roles: {}, ranks: {} },
      },
    ];

    test.each(validCases)('$name', async ({ input, expected }) => {
      const req = mockReq({});
      const res = mockRes();

      mockedFirebase.getDocsWithFields.mockResolvedValue(input as any);
      const response = await getUsersStats(req, res);

      expect(mockedFirebase.getDocsWithFields).toHaveBeenCalledWith(userCollection, [
        'role',
        'rank',
      ]);
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.USER_GET_STATS, expected);
      expect(response).toEqual({
        success: true,
        data: expected,
      });
    });
  });

  describe('error cases', () => {
    test('should return error when getDocsWithFields fails', async () => {
      const req = mockReq({});
      const res = mockRes();
      const error = new Error('firebase error');

      mockedFirebase.getDocsWithFields.mockRejectedValue(error);
      const response = await getUsersStats(req, res);

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        `${ErrorMessage.CANNOT_GET_USER_STATS} | ${error}`,
      );
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_GET_USER_STATS,
        ErrorMessage.CANNOT_GET_USER_STATS,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_USER_STATS,
        message: ErrorMessage.CANNOT_GET_USER_STATS,
      });
    });
  });
});

describe('getUserDetail()', () => {
  describe('valid cases', () => {
    test('should return user detail when user exists', async () => {
      const req = mockReq({ params: { userId: mockUser.id } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockUser as any);
      const response = await getUserDetail(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(userCollection, mockUser.id);
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.USER_GET_DETAIL, mockUser);
      expect(response).toEqual({
        success: true,
        data: mockUser,
      });
    });
  });

  describe('edge cases', () => {
    test('should return error when user not found', async () => {
      const req = mockReq({ params: { userId: 'notfound' } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null);
      const response = await getUserDetail(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(userCollection, 'notfound');
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.USER_NOT_FOUND,
        ErrorMessage.USER_NOT_FOUND,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.USER_NOT_FOUND,
        message: ErrorMessage.USER_NOT_FOUND,
      });
    });
  });

  describe('error cases', () => {
    test('should return error when firebase throws', async () => {
      const req = mockReq({ params: { userId: mockUser.id } });
      const res = mockRes();
      const error = new Error('firebase error');

      mockedFirebase.getDocById.mockRejectedValue(error);
      const response = await getUserDetail(req, res);

      expect(mockedLogger.warn).toHaveBeenCalledWith(ErrorMessage.USER_GET_DETAIL + error);
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.USER_GET_DETAIL,
        ErrorMessage.USER_GET_DETAIL,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.USER_GET_DETAIL,
        message: ErrorMessage.USER_GET_DETAIL,
      });
    });
  });
});

describe('getProfile()', () => {
  describe('valid cases', () => {
    test('should return profile when user exists', async () => {
      const req = mockReq({ user: { uid: mockUser.id } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockUser as any);
      const response = await getProfile(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(userCollection, mockUser.id);
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.USER_GET_PROFILE, mockUser);
      expect(response).toEqual({ success: true, data: mockUser });
    });
  });

  describe('edge cases', () => {
    test('should return error when uid is missing', async () => {
      const req = mockReq();
      const res = mockRes();
      req.user = undefined;
      const response = await getProfile(req, res);

      expect(mockedFirebase.getDocById).not.toHaveBeenCalled();
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.ACCOUNT_NOT_FOUND,
        ErrorMessage.ACCOUNT_NOT_FOUND,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.ACCOUNT_NOT_FOUND,
        message: ErrorMessage.ACCOUNT_NOT_FOUND,
      });
    });

    test('should return error when profile not found', async () => {
      const req = mockReq({ user: { uid: 'notfound' } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null);
      const response = await getProfile(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledWith(userCollection, 'notfound');
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.USER_NOT_FOUND,
        ErrorMessage.USER_NOT_FOUND,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.USER_NOT_FOUND,
        message: ErrorMessage.USER_NOT_FOUND,
      });
    });
  });

  describe('error cases', () => {
    test('should return error when firebase throws', async () => {
      const req = mockReq({ user: { uid: mockUser.id } });
      const res = mockRes();
      const error = new Error('firebase error');

      mockedFirebase.getDocById.mockRejectedValue(error);
      const response = await getProfile(req, res);

      expect(mockedLogger.warn).toHaveBeenCalledWith(ErrorMessage.USER_GET_PROFILE + error);
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.USER_GET_PROFILE,
        ErrorMessage.USER_GET_PROFILE,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.USER_GET_PROFILE,
        message: ErrorMessage.USER_GET_PROFILE,
      });
    });
  });
});

describe('updateUser()', () => {
  describe('valid cases', () => {
    test('should update without deleting image', async () => {
      const req = mockReq({ body: { full_name: 'New Name' } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue({ ...mockUser, image_url: 'old.jpg' } as any);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);
      const response = await updateUser(req, res);

      expect(deleteImages).not.toHaveBeenCalled();
      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        userCollection,
        req.user.uid,
        expect.objectContaining({
          full_name: 'New Name',
          image_url: 'old.jpg',
          updated_by: req.user.uid,
        }),
      );
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.USER_UPDATED, req.user.uid);
      expect(response).toEqual({ success: true, data: req.user.uid });
    });

    test('should delete old image when new image provided', async () => {
      const req = mockReq({ body: { full_name: 'New Name' } });
      const res = mockRes();
      req.file = { path: 'uploads\\new.jpg' } as any;

      mockedFirebase.getDocById.mockResolvedValue({ ...mockUser, image_url: 'old.jpg' } as any);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);
      const response = await updateUser(req, res);

      expect(deleteImages).toHaveBeenCalledWith(['old.jpg']);
      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        req.user.uid,
        expect.objectContaining({
          full_name: 'New Name',
          image_url: 'uploads/new.jpg',
          updated_by: req.user.uid,
        }),
      );
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.USER_UPDATED, req.user.uid);
      expect(response).toEqual({ success: true, data: req.user.uid });
    });
  });

  describe('edge cases', () => {
    test('should update with new image but no old image (no deleteImages)', async () => {
      const req = mockReq({ body: { full_name: 'New Name' } });
      const res = mockRes();
      req.file = { path: 'uploads\\new.jpg' } as any;

      mockedFirebase.getDocById.mockResolvedValue({ ...mockUser, image_url: null } as any);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);
      const response = await updateUser(req, res);

      expect(deleteImages).not.toHaveBeenCalled();
      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        userCollection,
        req.user.uid,
        expect.objectContaining({
          full_name: 'New Name',
          image_url: 'uploads/new.jpg',
          updated_by: req.user.uid,
        }),
      );
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.USER_UPDATED, req.user.uid);
      expect(response).toEqual({ success: true, data: req.user.uid });
    });

    test('should normalize image path correctly', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      req.file = { path: 'a\\b\\c.jpg' } as any;

      mockedFirebase.getDocById.mockResolvedValue({ ...mockUser, image_url: null } as any);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);
      const response = await updateUser(req, res);

      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        userCollection,
        req.user.uid,
        expect.objectContaining({
          image_url: 'a/b/c.jpg',
        }),
      );
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.USER_UPDATED, req.user.uid);
      expect(response).toEqual({ success: true, data: req.user.uid });
    });
  });

  describe('error cases', () => {
    test('should return USER_NOT_FOUND when user does not exist', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null);
      const response = await updateUser(req, res);

      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.USER_NOT_FOUND,
        ErrorMessage.USER_NOT_FOUND,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.USER_NOT_FOUND,
        message: ErrorMessage.USER_NOT_FOUND,
      });
    });

    const errorCases = [
      {
        name: 'should handle error when getDocById fails',
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firebase error'));
        },
      },
      {
        name: 'should handle error when updateDoc fails',
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockUser as any);
          mockedFirebase.updateDoc.mockRejectedValue(new Error('firebase error'));
        },
      },
      {
        name: 'should handle error when deleteImages fails',
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue({
            ...mockUser,
            image_url: 'old.jpg',
          } as any);

          (deleteImages as jest.Mock).mockRejectedValue(new Error('delete error'));
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire }) => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      req.file = { path: 'uploads\\new.jpg' } as any;

      mockFire();
      const response = await updateUser(req, res);

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(ErrorMessage.USER_UPDATED),
      );
      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.USER_UPDATE,
        ErrorMessage.REQUEST_FAILED,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.USER_UPDATE,
        message: ErrorMessage.REQUEST_FAILED,
      });
    });
  });
});

describe('createUser()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'create USER by default',
        input: {
          body: { ...mockCreateUserBody },
        },
        expected: {
          role: UserRole.USER,
          permissions: [],
          validateCalls: 0,
        },
      },
      {
        name: 'create MANAGER with valid permissions',
        input: {
          body: {
            ...mockCreateUserBody,
            role: UserRole.MANAGER,
            permissions: [Permission.CREATE_SITE, Permission.UPDATE_SITE],
          },
        },
        expected: {
          role: UserRole.MANAGER,
          permissions: [Permission.CREATE_SITE, Permission.UPDATE_SITE],
          validateCalls: 2,
        },
      },
      {
        name: 'ignore permissions when role is USER',
        input: {
          body: {
            ...mockCreateUserBody,
            role: UserRole.USER,
            permissions: [Permission.CREATE_SITE],
          },
        },
        expected: {
          role: UserRole.USER,
          permissions: [],
          validateCalls: 1,
        },
      },
      {
        name: 'skip validate when permissions not provided',
        input: {
          body: {
            ...mockCreateUserBody,
            role: UserRole.MANAGER,
          },
        },
        expected: {
          role: UserRole.MANAGER,
          permissions: [],
          validateCalls: 0,
        },
      },
    ];

    test.each(validCases)('$name', async ({ input, expected }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValue([]);
      mockedFirebase.getDocById.mockResolvedValue({ id: Permission.CREATE_SITE } as any);
      createUserMock.mockResolvedValue({ uid: mockUid });
      mockedFirebase.createDoc.mockResolvedValue({ id: mockUid } as any);
      const response = await createUser(req, res);

      expect(mockedFirebase.getDocById).toHaveBeenCalledTimes(expected.validateCalls);
      expect(createUserMock).toHaveBeenCalledWith(
        expect.objectContaining({
          email: input.body.email,
          password: input.body.password,
          displayName: input.body.full_name,
        }),
      );
      expect(createUserMock).toHaveBeenCalledTimes(1);
      expect(mockedFirebase.createDoc).toHaveBeenCalledWith(
        userCollection,
        expect.objectContaining({
          id: mockUid,
          email: input.body.email,
          username: input.body.username,
          phone: input.body.phone,
          full_name: input.body.full_name,
          role: expected.role,
          permissions: expected.permissions,
          image_url: DEFAULT_AVATAR_URL,
          rank: UserRank.BRONZE,
          points: 0,
          status: ActiveStatus.ACTIVE,
          created_by: req.user?.uid,
        }),
      );
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.USER_CREATED,
        expect.objectContaining({
          id: mockUid,
          email: input.body.email,
          role: expected.role,
          permissions: expected.permissions,
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          id: mockUid,
          role: expected.role,
          permissions: expected.permissions,
        }),
      });
    });
  });

  describe('error cases', () => {
    describe('error cases', () => {
      test('should return error when email already exists', async () => {
        const req = mockReq({ body: mockCreateUserBody });
        const res = mockRes();

        mockedFirebase.getDocByField.mockResolvedValue([{ id: '2Wv3zE7vsianIJyrafPFJ98YWSj2' }]);
        const response = await createUser(req, res);

        expect(responseError).toHaveBeenCalledWith(
          res,
          StatusCode.ACCOUNT_EMAIL_EXISTS,
          ErrorMessage.ACCOUNT_EMAIL_EXISTS,
        );
        expect(createUserMock).not.toHaveBeenCalled();
        expect(response).toEqual({
          success: false,
          status: StatusCode.ACCOUNT_EMAIL_EXISTS,
          message: ErrorMessage.ACCOUNT_EMAIL_EXISTS,
        });
      });

      test('should return error when permission not found', async () => {
        const req = mockReq({
          body: {
            ...mockCreateUserBody,
            role: UserRole.MANAGER,
            permissions: ['INVALID_PERMISSION'],
          },
        });
        const res = mockRes();

        mockedFirebase.getDocByField.mockResolvedValue([]);
        mockedFirebase.getDocById.mockResolvedValue(null);
        const response = await createUser(req, res);

        expect(responseError).toHaveBeenCalledWith(
          res,
          StatusCode.PERMISSION_NOT_FOUND,
          expect.stringContaining('INVALID_PERMISSION'),
        );
        expect(createUserMock).not.toHaveBeenCalled();
        expect(response).toEqual({
          success: false,
          status: StatusCode.PERMISSION_NOT_FOUND,
          message: expect.stringContaining('INVALID_PERMISSION'),
        });
      });

      test('should handle firebase auth error', async () => {
        const req = mockReq({ body: mockCreateUserBody });
        const res = mockRes();

        mockedFirebase.getDocByField.mockResolvedValue([]);
        createUserMock.mockRejectedValue({
          code: 'auth/email-already-exists',
          message: 'Email already exists',
        });
        const response = await createUser(req, res);

        expect(responseError).toHaveBeenCalledWith(
          res,
          StatusCode.FIREBASE_AUTH_FAILED,
          expect.stringContaining(ErrorMessage.FIREBASE_AUTH_FAILED),
        );
        expect(response).toEqual({
          success: false,
          status: StatusCode.FIREBASE_AUTH_FAILED,
          message: expect.stringContaining(ErrorMessage.FIREBASE_AUTH_FAILED),
        });
      });

      test('should return error when createDoc fails', async () => {
        const req = mockReq({ body: mockCreateUserBody });
        const res = mockRes();

        mockedFirebase.getDocByField.mockResolvedValue([]);
        createUserMock.mockResolvedValue({ uid: mockUid });
        mockedFirebase.createDoc.mockResolvedValue(null as any);
        const response = await createUser(req, res);

        expect(responseError).toHaveBeenCalledWith(
          res,
          StatusCode.CANNOT_CREATE_USER,
          ErrorMessage.CANNOT_CREATE_USER,
        );
        expect(response).toEqual({
          success: false,
          status: StatusCode.CANNOT_CREATE_USER,
          message: ErrorMessage.CANNOT_CREATE_USER,
        });
      });

      test('should handle unexpected error', async () => {
        const req = mockReq({ body: mockCreateUserBody });
        const res = mockRes();

        mockedFirebase.getDocByField.mockRejectedValue(new Error('DB crash'));
        const response = await createUser(req, res);

        expect(responseError).toHaveBeenCalledWith(
          res,
          StatusCode.CANNOT_CREATE_USER,
          expect.stringContaining(ErrorMessage.CANNOT_CREATE_USER),
        );
        expect(response).toEqual({
          success: false,
          status: StatusCode.CANNOT_CREATE_USER,
          message: expect.stringContaining(ErrorMessage.CANNOT_CREATE_USER),
        });
      });
    });
  });
});

describe('createSuperManager()', () => {
  describe('valid cases', () => {
    test('should seed permissions and create super manager when no permissions exist', async () => {
      const req = mockReq({
        body: mockCreateUserBody,
        headers: { 'x-init-secret': ENV.INIT_MANAGER_SECRET },
      });
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValue([]);
      mockedFirebase.getAllDocs.mockResolvedValue([]);
      mockedFirebase.createBatchDocs.mockResolvedValue(undefined as any);
      mockedFirebase.createDoc.mockResolvedValue({ id: mockUid } as any);
      createUserMock.mockResolvedValue({ uid: mockUid });

      const response = await createSuperManager(req, res);

      expect(mockedFirebase.createBatchDocs).toHaveBeenCalledTimes(1);
      expect(mockedFirebase.createDoc).toHaveBeenCalledWith(
        userCollection,
        expect.objectContaining({
          id: mockUid,
          role: UserRole.MANAGER,
          permissions: expect.arrayContaining(Object.keys(permissionSeed)),
        }),
      );
      expect(createUserMock).toHaveBeenCalledTimes(1);
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.SUPER_MANAGER_CREATED,
        expect.objectContaining({
          id: mockUid,
          role: UserRole.MANAGER,
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          id: mockUid,
          role: UserRole.MANAGER,
          permissions: expect.any(Array),
        }),
      });
    });

    test('should skip seeding permissions when permissions already exist', async () => {
      const req = mockReq({
        body: mockCreateUserBody,
        headers: { 'x-init-secret': ENV.INIT_MANAGER_SECRET },
      });
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValue([]);
      mockedFirebase.getAllDocs.mockResolvedValue([{ id: Permission.CREATE_SITE }] as any);
      mockedFirebase.createBatchDocs.mockResolvedValue(undefined as any);
      mockedFirebase.createDoc.mockResolvedValue({ id: mockUid } as any);
      createUserMock.mockResolvedValue({ uid: mockUid });

      const response = await createSuperManager(req, res);

      expect(mockedFirebase.createBatchDocs).not.toHaveBeenCalled();
      expect(mockedFirebase.createDoc).toHaveBeenCalledWith(
        userCollection,
        expect.objectContaining({
          role: UserRole.MANAGER,
        }),
      );
      expect(createUserMock).toHaveBeenCalledTimes(1);
      expect(responseSuccess).toHaveBeenCalledWith(
        res,
        Message.SUPER_MANAGER_CREATED,
        expect.objectContaining({
          id: mockUid,
          role: UserRole.MANAGER,
        }),
      );
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          id: mockUid,
          role: UserRole.MANAGER,
          permissions: expect.any(Array),
        }),
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return UNAUTHORIZED when secret is invalid',
        input: {
          body: mockCreateUserBody,
          headers: { 'x-init-secret': 'wrong-secret' },
        },
        mockFire: () => {},
        error: {
          status: StatusCode.UNAUTHORIZED,
          message: ErrorMessage.UNAUTHORIZED,
        },
      },
      {
        name: 'should return UNAUTHORIZED when manager already exists',
        input: {
          body: mockCreateUserBody,
          headers: { 'x-init-secret': ENV.INIT_MANAGER_SECRET },
        },
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([{ id: mockUid }] as any);
        },
        error: {
          status: StatusCode.UNAUTHORIZED,
          message: ErrorMessage.UNAUTHORIZED,
        },
      },
      {
        name: 'should return error when seed permissions fails',
        input: {
          body: mockCreateUserBody,
          headers: { 'x-init-secret': ENV.INIT_MANAGER_SECRET },
        },
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([]);
          mockedFirebase.getAllDocs.mockResolvedValue([]);
          mockedFirebase.createBatchDocs.mockRejectedValue(new Error('seed error'));
        },
        error: {
          status: StatusCode.CANNOT_CREATE_SUPER_MANAGER,
          message: 'seed error',
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();
      const response = await createSuperManager(req, res);

      expect(responseError).toHaveBeenCalledWith(
        res,
        error.status,
        expect.stringContaining(error.message),
      );
      expect(mockedFirebase.createDoc).not.toHaveBeenCalled();
      expect(createUserMock).not.toHaveBeenCalled();
      expect(response).toEqual({
        success: false,
        status: error.status,
        message: expect.stringContaining(error.message),
      });
    });

    test('should return FIREBASE_AUTH_FAILED when auth fails', async () => {
      const req = mockReq({
        body: mockCreateUserBody,
        headers: { 'x-init-secret': ENV.INIT_MANAGER_SECRET },
      });

      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValue([]);
      mockedFirebase.getAllDocs.mockResolvedValue([{ id: Permission.CREATE_SITE }] as any);
      createUserMock.mockRejectedValue({ code: 'auth/invalid-email', message: 'invalid email' });
      const response = await createSuperManager(req, res);

      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.FIREBASE_AUTH_FAILED,
        expect.stringContaining(ErrorMessage.FIREBASE_AUTH_FAILED),
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.FIREBASE_AUTH_FAILED,
        message: expect.stringContaining(ErrorMessage.FIREBASE_AUTH_FAILED),
      });
    });

    test('should return CANNOT_CREATE_USER when createDoc fails', async () => {
      const req = mockReq({
        body: mockCreateUserBody,
        headers: { 'x-init-secret': ENV.INIT_MANAGER_SECRET },
      });
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValue([]);
      mockedFirebase.getAllDocs.mockResolvedValue([{ id: Permission.CREATE_SITE }] as any);
      createUserMock.mockResolvedValue({ uid: mockUid });
      mockedFirebase.createDoc.mockResolvedValue(null as any);

      const response = await createSuperManager(req, res);

      expect(responseError).toHaveBeenCalledWith(
        res,
        StatusCode.CANNOT_CREATE_USER,
        ErrorMessage.CANNOT_CREATE_USER,
      );
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_CREATE_USER,
        message: ErrorMessage.CANNOT_CREATE_USER,
      });
    });
  });
});

describe('updatePassword()', () => {
  describe('valid cases', () => {
    const validCases = [
      { name: 'should update password and revoke multiple tokens', input: mockTokens.multiple },
      { name: 'should succeed when no active tokens exist', input: mockTokens.empty },
      { name: 'should handle already revoked tokens safely', input: mockTokens.alreadyRevoked },
    ];

    test.each(validCases)('$name', async ({ input }) => {
      const req = mockReq({ body: { password: 'newPassword123' } });
      const res = mockRes();
      req.user = { uid: mockUid } as any;

      updateUserMock.mockResolvedValue(undefined as any);
      revokeRefreshTokensMock.mockResolvedValue(undefined as any);

      mockedFirebase.getDocsByFields.mockResolvedValue(input);
      mockedFirebase.updateBatchDocs.mockResolvedValue(undefined as any);
      const response = await updatePassword(req, res);

      expect(updateUserMock).toHaveBeenCalledWith(mockUid, { password: 'newPassword123' });
      expect(revokeRefreshTokensMock).toHaveBeenCalledWith(mockUid);
      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledTimes(1);
      expect(mockedFirebase.updateBatchDocs).toHaveBeenCalledTimes(1);
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.PASSWORD_UPDATED, { id: mockUid });
      expect(response).toEqual({ success: true, data: { id: mockUid } });
    });
  });

  describe('edge cases', () => {
    test('should call updateUser with empty password when password is missing', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      req.user = { uid: mockUid } as any;

      updateUserMock.mockResolvedValue(undefined);
      revokeRefreshTokensMock.mockResolvedValue(undefined);

      mockedFirebase.getDocsByFields.mockResolvedValue(mockTokens.multiple);
      mockedFirebase.updateBatchDocs.mockResolvedValue(undefined as any);
      const response = await updatePassword(req, res);

      expect(updateUserMock).toHaveBeenCalledWith(mockUid, { password: undefined });
      expect(revokeRefreshTokensMock).toHaveBeenCalledWith(mockUid);
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.PASSWORD_UPDATED, { id: mockUid });
      expect(response).toEqual({ success: true, data: { id: mockUid } });
    });

    test('should handle empty password string normally', async () => {
      const req = mockReq({ body: { password: '' } });
      const res = mockRes();
      req.user = { uid: mockUid } as any;

      updateUserMock.mockResolvedValue(undefined);
      revokeRefreshTokensMock.mockResolvedValue(undefined);

      mockedFirebase.getDocsByFields.mockResolvedValue(mockTokens.multiple);
      mockedFirebase.updateBatchDocs.mockResolvedValue(undefined as any);
      const response = await updatePassword(req, res);

      expect(updateUserMock).toHaveBeenCalledWith(mockUid, { password: '' });
      expect(responseSuccess).toHaveBeenCalledWith(res, Message.PASSWORD_UPDATED, { id: mockUid });
      expect(response).toEqual({ success: true, data: { id: mockUid } });
    });

    test('should treat missing uid as undefined and still resolve success', async () => {
      const req = mockReq({ body: { password: 'newPassword123' } });
      const res = mockRes();
      req.user = undefined as any;

      updateUserMock.mockResolvedValue(undefined);
      revokeRefreshTokensMock.mockResolvedValue(undefined);
      mockedFirebase.getDocsByFields.mockResolvedValue([]);
      mockedFirebase.updateBatchDocs.mockResolvedValue(undefined as any);
      const response = await updatePassword(req, res);

      expect(updateUserMock).toHaveBeenCalledWith(undefined, { password: 'newPassword123' });
      expect(response).toEqual({ success: true, data: { id: undefined } });
    });

    test('should still updateBatchDocs even when token list is empty', async () => {
      const req = mockReq({ body: { password: 'newPassword123' } });
      const res = mockRes();
      req.user = { uid: mockUid } as any;

      updateUserMock.mockResolvedValue(undefined);
      revokeRefreshTokensMock.mockResolvedValue(undefined);

      mockedFirebase.getDocsByFields.mockResolvedValue([]);
      mockedFirebase.updateBatchDocs.mockResolvedValue(undefined as any);
      await updatePassword(req, res);

      expect(mockedFirebase.updateBatchDocs).toHaveBeenCalledWith(
        `${userCollection}/${mockUid}/tokens`,
        [],
      );
    });

    test('should ensure Firebase query happens after revoke is triggered', async () => {
      const req = mockReq({ body: { password: 'newPassword123' } });
      const res = mockRes();
      req.user = { uid: mockUid } as any;

      updateUserMock.mockResolvedValue(undefined);
      revokeRefreshTokensMock.mockResolvedValue(undefined);
      mockedFirebase.getDocsByFields.mockResolvedValue([]);
      mockedFirebase.updateBatchDocs.mockResolvedValue(undefined as any);

      await updatePassword(req, res);

      expect(updateUserMock).toHaveBeenCalledTimes(1);
      expect(revokeRefreshTokensMock).toHaveBeenCalledTimes(1);
      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledTimes(1);
      expect(mockedFirebase.updateBatchDocs).toHaveBeenCalledTimes(1);
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return FIREBASE_AUTH_FAILED when updateUser fails',
        mockFire: () => {
          updateUserMock.mockRejectedValue({
            code: 'auth/invalid-password',
            message: 'invalid password',
          });
          revokeRefreshTokensMock.mockResolvedValue(undefined);
        },
        error: {
          status: StatusCode.FIREBASE_AUTH_FAILED,
          message: expect.stringContaining(ErrorMessage.FIREBASE_AUTH_FAILED),
        },
      },

      {
        name: 'should return FIREBASE_AUTH_FAILED when revokeRefreshTokens fails',
        mockFire: () => {
          updateUserMock.mockResolvedValue(undefined);
          revokeRefreshTokensMock.mockRejectedValue({
            code: 'auth/revoke-error',
            message: 'revoke failed',
          });
        },
        error: {
          status: StatusCode.FIREBASE_AUTH_FAILED,
          message: expect.stringContaining(ErrorMessage.FIREBASE_AUTH_FAILED),
        },
      },

      {
        name: 'should return CANNOT_UPDATE_PASSWORD when getDocsByFields fails',
        mockFire: () => {
          updateUserMock.mockResolvedValue(undefined);
          revokeRefreshTokensMock.mockResolvedValue(undefined);
          mockedFirebase.getDocsByFields.mockRejectedValue(new Error('db error'));
        },
        error: {
          status: StatusCode.CANNOT_UPDATE_PASSWORD,
          message: expect.stringContaining(ErrorMessage.CANNOT_UPDATE_PASSWORD),
        },
      },

      {
        name: 'should return CANNOT_UPDATE_PASSWORD when updateBatchDocs fails',
        mockFire: () => {
          updateUserMock.mockResolvedValue(undefined);
          revokeRefreshTokensMock.mockResolvedValue(undefined);
          mockedFirebase.getDocsByFields.mockResolvedValue(mockTokens.multiple);
          mockedFirebase.updateBatchDocs.mockRejectedValue(new Error('batch error'));
        },
        error: {
          status: StatusCode.CANNOT_UPDATE_PASSWORD,
          message: expect.stringContaining(ErrorMessage.CANNOT_UPDATE_PASSWORD),
        },
      },

      {
        name: 'should return CANNOT_UPDATE_PASSWORD when req.user is missing',
        mockFire: () => {},
        error: {
          status: StatusCode.CANNOT_UPDATE_PASSWORD,
          message: expect.stringContaining(ErrorMessage.CANNOT_UPDATE_PASSWORD),
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq({ body: { password: 'newPassword123' } });
      const res = mockRes();
      req.user = undefined as any;

      mockFire();
      const response = await updatePassword(req, res);

      expect(responseError).toHaveBeenCalledWith(res, error.status, error.message);
      expect(response).toEqual({
        success: false,
        status: error.status,
        message: error.message,
      });
    });
  });
});

describe('updateUserPermissions()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should update multiple permissions successfully',
        input: { permissions: [Permission.UPDATE_USER, Permission.CREATE_USER] },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce({ id: mockUid })
            .mockResolvedValueOnce({ id: Permission.UPDATE_USER })
            .mockResolvedValueOnce({ id: Permission.CREATE_USER });
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: { permissions: [Permission.UPDATE_USER, Permission.CREATE_USER] },
      },
      {
        name: 'should deduplicate permissions',
        input: { permissions: [Permission.UPDATE_USER, Permission.UPDATE_USER] },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce({ id: mockUid })
            .mockResolvedValueOnce({ id: Permission.UPDATE_USER });
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: { permissions: [Permission.UPDATE_USER] },
      },
      {
        name: 'should handle single permission',
        input: { permissions: [Permission.UPDATE_USER] },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce({ id: mockUid })
            .mockResolvedValueOnce({ id: Permission.UPDATE_USER });
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: { permissions: [Permission.UPDATE_USER] },
      },
      {
        name: 'should handle empty permissions array',
        input: { permissions: [] },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce({ id: mockUid });
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: { permissions: [] },
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire, expected }) => {
      const req = mockReq({ params: { userId: mockUid }, body: input });
      const res = mockRes();
      req.user = { uid: mockUid } as any;

      mockFire();
      const response = await updateUserPermissions(req, res);

      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        userCollection,
        mockUid,
        expect.objectContaining({
          permissions: expected.permissions,
          updated_by: mockUid,
        }),
      );
      expect(response).toEqual({
        success: true,
        data: { id: mockUid, permissions: expected.permissions },
      });
    });
  });

  describe('edge cases', () => {
    test('should handle empty permissions array safely', async () => {
      const req = mockReq({ params: { userId: mockUid }, body: { permissions: [] } });
      const res = mockRes();
      req.user = { uid: mockUid } as any;

      mockedFirebase.getDocById.mockResolvedValueOnce({ id: mockUid });
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
      const response = await updateUserPermissions(req, res);

      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        userCollection,
        mockUid,
        expect.objectContaining({ permissions: [], updated_by: mockUid }),
      );

      expect(response).toEqual({ success: true, data: { id: mockUid, permissions: [] } });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return USER_NOT_FOUND when user does not exist',
        input: { permissions: [Permission.UPDATE_USER] },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(null);
        },
        error: { status: StatusCode.USER_NOT_FOUND, message: ErrorMessage.USER_NOT_FOUND },
      },

      {
        name: 'should return PERMISSION_NOT_FOUND when permission does not exist',
        input: { permissions: [Permission.UPDATE_USER] },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce({ id: mockUid })
            .mockResolvedValueOnce(null);
        },
        error: {
          status: StatusCode.PERMISSION_NOT_FOUND,
          message: expect.stringContaining(Permission.UPDATE_USER),
        },
      },

      {
        name: 'should return PERMISSION_NOT_FOUND when one permission in list is invalid',
        input: { permissions: [Permission.UPDATE_USER, 'INVALID_PERMISSION' as any] },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce({ id: mockUid })
            .mockResolvedValueOnce({ id: Permission.UPDATE_USER })
            .mockResolvedValueOnce(null);
        },
        error: {
          status: StatusCode.PERMISSION_NOT_FOUND,
          message: expect.stringContaining('INVALID_PERMISSION'),
        },
      },

      {
        name: 'should return USER_UPDATE when firebase updateDoc fails',
        input: { permissions: [Permission.UPDATE_USER] },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce({ id: mockUid })
            .mockResolvedValueOnce({ id: Permission.UPDATE_USER });
          mockedFirebase.updateDoc.mockRejectedValue(new Error('db error'));
        },
        error: { status: StatusCode.USER_UPDATE, message: ErrorMessage.REQUEST_FAILED },
      },

      {
        name: 'should return USER_UPDATE when firebase getDocById throws error',
        input: { permissions: [Permission.UPDATE_USER] },
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('db crash'));
        },
        error: { status: StatusCode.USER_UPDATE, message: ErrorMessage.REQUEST_FAILED },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq({ params: { userId: mockUid }, body: input });
      const res = mockRes();
      req.user = { uid: mockUid } as any;

      mockFire();
      const response = await updateUserPermissions(req, res);

      expect(responseError).toHaveBeenCalledWith(res, error.status, error.message);
      expect(response).toEqual({ success: false, status: error.status, message: error.message });
    });
  });
});
