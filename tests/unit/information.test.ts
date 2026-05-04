jest.mock('../../utils', () => {
  const { utilMock } = require('../helpers/utilMock');
  return utilMock({
    sendEmail: jest.fn(),
  })();
});

import {
  createInformation,
  getInformationList,
  getInformation,
  sendInformation,
} from '../../services/information';
import { ErrorMessage, StatusCode } from '../../constants/message';
import {
  InformationPriority,
  InformationStatus,
  InformationTarget,
  UserRole,
} from '../../constants/enum';
import { firebaseHelper, sendEmail } from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import {
  mockUserId,
  mockInformationId,
  mockUser,
  mockUserNoEmail,
  mockUsers,
  mockManagers,
  mockInformation,
  mockHighPriorityAllInfo,
  mockManagerTargetInfo,
  mockInformationList,
  mockGetListInput,
  mockGetInfoInput,
  mockCreateInfoInput,
  mockCreateHighPriorityAllInput,
  mockCreateHighPriorityManagerInput,
  mockCreateScheduledInput,
} from '../data/information.mock';
import { User } from '../../interfaces/user';

const mockedFirebase = jest.mocked(firebaseHelper);
const mockedSendEmail = jest.mocked(sendEmail);

beforeEach(() => {
  jest.clearAllMocks();

  mockedSendEmail.mockResolvedValue(undefined as never);
});

describe('createInformation()', () => {
  const defaultMockFire = () => {
    mockedFirebase.getDocByField.mockResolvedValue([]);
    mockedFirebase.createDoc.mockResolvedValue({ id: mockInformationId } as any);
  };

  describe('valid cases', () => {
    test('should create normal priority information successfully', async () => {
      const req = mockReq(mockCreateInfoInput);
      const res = mockRes();

      defaultMockFire();

      const response = await createInformation(req, res);
      expect(response).toEqual({
        success: true,
        data: { id: mockInformationId },
      });
      expect(mockedSendEmail).not.toHaveBeenCalled();
    });

    test('should set status to SCHEDULED when schedule_at is provided', async () => {
      const req = mockReq(mockCreateScheduledInput);
      const res = mockRes();

      defaultMockFire();

      await createInformation(req, res);

      expect(mockedFirebase.createDoc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: InformationStatus.SCHEDULED,
        }),
      );
    });

    test('should set status to SENT when schedule_at is not provided', async () => {
      const req = mockReq(mockCreateInfoInput);
      const res = mockRes();

      defaultMockFire();

      await createInformation(req, res);

      expect(mockedFirebase.createDoc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: InformationStatus.SENT,
        }),
      );
    });

    test('should send email to all users when priority is HIGH and target is ALL', async () => {
      const req = mockReq(mockCreateHighPriorityAllInput);
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValue([]);
      mockedFirebase.createDoc.mockResolvedValue({ id: mockInformationId } as any);
      mockedFirebase.getAllDocs.mockResolvedValue(mockUsers as any);

      const response = await createInformation(req, res);
      expect(response).toEqual({
        success: true,
        data: { id: mockInformationId },
      });
      expect(mockedFirebase.getAllDocs).toHaveBeenCalledWith(expect.stringContaining('users'));
      expect(mockedSendEmail).toHaveBeenCalledTimes(mockUsers.length);
    });

    test('should send email to managers only when priority is HIGH and target is MANAGER', async () => {
      const req = mockReq(mockCreateHighPriorityManagerInput);
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValue([]);
      mockedFirebase.createDoc.mockResolvedValue({ id: mockInformationId } as any);
      mockedFirebase.getDocsByFields.mockResolvedValue(mockManagers as any);

      const response = await createInformation(req, res);
      expect(response).toEqual({
        success: true,
        data: { id: mockInformationId },
      });
      expect(mockedFirebase.getDocsByFields).toHaveBeenCalledWith(
        expect.stringContaining('users'),
        expect.arrayContaining([
          expect.objectContaining({ field: 'role', value: UserRole.MANAGER }),
        ]),
      );
      expect(mockedSendEmail).toHaveBeenCalledTimes(mockManagers.length);
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return INFORMATION_TITLE_EXISTS when title already exists',
        input: mockCreateInfoInput,
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([mockInformation] as any);
        },
        error: {
          statusCode: StatusCode.INFORMATION_TITLE_EXISTS,
          errorMessage: ErrorMessage.INFORMATION_TITLE_EXISTS,
        },
      },
      {
        name: 'should return USER_NOT_FOUND when no users found for HIGH priority',
        input: mockCreateHighPriorityAllInput,
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([]);
          mockedFirebase.createDoc.mockResolvedValue({ id: mockInformationId } as any);
          mockedFirebase.getAllDocs.mockResolvedValue([]);
        },
        error: {
          statusCode: StatusCode.USER_NOT_FOUND,
          errorMessage: ErrorMessage.USER_NOT_FOUND,
        },
      },
      {
        name: 'should return NO_RECIPIENT_EMAILS when all users have no email',
        input: mockCreateHighPriorityAllInput,
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([]);
          mockedFirebase.createDoc.mockResolvedValue({ id: mockInformationId } as any);
          mockedFirebase.getAllDocs.mockResolvedValue([mockUserNoEmail] as any);
        },
        error: {
          statusCode: StatusCode.NO_RECIPIENT_EMAILS,
          errorMessage: ErrorMessage.NO_RECIPIENT_EMAILS,
        },
      },
      {
        name: 'should return SEND_INFORMATION_FAILED when sendEmail throws',
        input: mockCreateHighPriorityAllInput,
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([]);
          mockedFirebase.createDoc.mockResolvedValue({ id: mockInformationId } as any);
          mockedFirebase.getAllDocs.mockResolvedValue(mockUsers as any);
          mockedSendEmail.mockRejectedValue(new Error('SMTP error'));
        },
        error: {
          statusCode: StatusCode.SEND_INFORMATION_FAILED,
          errorMessage: ErrorMessage.SEND_INFORMATION_FAILED,
        },
      },
      {
        name: 'should return CANNOT_CREATE_INFORMATION on unknown firestore error',
        input: mockCreateInfoInput,
        mockFire: () => {
          mockedFirebase.getDocByField.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.CANNOT_CREATE_INFORMATION,
          errorMessage: ErrorMessage.CANNOT_CREATE_INFORMATION,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await createInformation(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('getInformationList()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return all information without filters',
        input: mockGetListInput,
        mockFire: () => {
          mockedFirebase.countAllDocs.mockResolvedValue(2);
          mockedFirebase.getAllDocs.mockResolvedValue(mockInformationList as any);
        },
        expected: {
          informationList: mockInformationList,
          pagination: { page: 1, page_size: 10, total: 2, total_page: 1 },
        },
      },
      {
        name: 'should return filtered by status',
        input: { ...mockGetListInput, query: { status: 'sent' } },
        mockFire: () => {
          mockedFirebase.countDocsByFields.mockResolvedValue(2);
          mockedFirebase.getDocsByFields.mockResolvedValue(mockInformationList as any);
        },
        expected: {
          informationList: mockInformationList,
          pagination: { page: 1, page_size: 10, total: 2, total_page: 1 },
        },
      },
      {
        name: 'should return filtered by category',
        input: { ...mockGetListInput, query: { category: 'maintenance' } },
        mockFire: () => {
          mockedFirebase.countDocsByFields.mockResolvedValue(1);
          mockedFirebase.getDocsByFields.mockResolvedValue([mockInformation] as any);
        },
        expected: {
          informationList: [mockInformation],
          pagination: { page: 1, page_size: 10, total: 1, total_page: 1 },
        },
      },
      {
        name: 'should return filtered by priority',
        input: { ...mockGetListInput, query: { priority: InformationPriority.HIGH } },
        mockFire: () => {
          mockedFirebase.countDocsByFields.mockResolvedValue(1);
          mockedFirebase.getDocsByFields.mockResolvedValue([mockHighPriorityAllInfo] as any);
        },
        expected: {
          informationList: [mockHighPriorityAllInfo],
          pagination: { page: 1, page_size: 10, total: 1, total_page: 1 },
        },
      },
      {
        name: 'should return filtered by target',
        input: { ...mockGetListInput, query: { target: InformationTarget.MANAGER } },
        mockFire: () => {
          mockedFirebase.countDocsByFields.mockResolvedValue(1);
          mockedFirebase.getDocsByFields.mockResolvedValue([mockManagerTargetInfo] as any);
        },
        expected: {
          informationList: [mockManagerTargetInfo],
          pagination: { page: 1, page_size: 10, total: 1, total_page: 1 },
        },
      },
      {
        name: 'should return filtered by schedule_from and schedule_to and override orderBy to schedule_at',
        input: {
          ...mockGetListInput,
          query: {
            schedule_from: '2026-05-01T00:00:00.000Z',
            schedule_to: '2026-05-31T23:59:59.000Z',
          },
        },
        mockFire: () => {
          mockedFirebase.countDocsByFields.mockResolvedValue(1);
          mockedFirebase.getDocsByFields.mockResolvedValue([mockInformation] as any);
        },
        expected: {
          informationList: [mockInformation],
          pagination: { page: 1, page_size: 10, total: 1, total_page: 1 },
        },
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire, expected }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await getInformationList(req, res);
      expect(response).toEqual({
        success: true,
        data: {
          informationList: expected.informationList,
          pagination: expected.pagination,
        },
      });
    });
  });

  describe('edge cases', () => {
    describe('pagination', () => {
      const cases = [
        {
          name: 'should handle missing pagination',
          input: { ...mockGetListInput, pagination: undefined },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(2);
            mockedFirebase.getAllDocs.mockResolvedValue(mockInformationList as any);
          },
          expected: {
            informationList: mockInformationList,
            pagination: { page: 1, page_size: 10, total: 2, total_page: 1 },
          },
        },
        {
          name: 'should handle null pagination',
          input: { ...mockGetListInput, pagination: null },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(3);
            mockedFirebase.getAllDocs.mockResolvedValue(mockInformationList as any);
          },
          expected: {
            informationList: mockInformationList,
            pagination: { page: undefined, page_size: undefined, total: 3, total_page: 1 },
          },
        },
        {
          name: 'should calculate totalPage correctly',
          input: { ...mockGetListInput, pagination: { page: 1, page_size: 1 } },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(5);
            mockedFirebase.getAllDocs.mockResolvedValue([mockInformation] as any);
          },
          expected: {
            informationList: [mockInformation],
            pagination: { page: 1, page_size: 1, total: 5, total_page: 5 },
          },
        },
      ];

      test.each(cases)('$name', async ({ input, mockFire, expected }) => {
        const req = mockReq(input);
        const res = mockRes();

        mockFire();

        const response = await getInformationList(req, res);
        expect(response).toEqual({
          success: true,
          data: {
            informationList: expected.informationList,
            pagination: expected.pagination,
          },
        });
      });
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq(mockGetListInput);
      const res = mockRes();

      mockedFirebase.countAllDocs.mockRejectedValue(new Error('firestore error'));

      const response = await getInformationList(req, res);
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_INFORMATION_LIST,
        message: ErrorMessage.CANNOT_GET_INFORMATION_LIST,
      });
    });
  });
});

describe('getInformation()', () => {
  describe('valid cases', () => {
    test('should return information detail for MANAGER role', async () => {
      const req = mockReq(mockGetInfoInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockManagerTargetInfo as any);

      const response = await getInformation(req, res);
      expect(response).toEqual({
        success: true,
        data: { information: expect.objectContaining(mockManagerTargetInfo) },
      });
    });

    test('should return information detail for non-MANAGER when target is ALL', async () => {
      const req = mockReq({
        ...mockGetInfoInput,
        user: { uid: mockUserId, role: UserRole.USER },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockInformation as any);

      const response = await getInformation(req, res);
      expect(response).toEqual({
        success: true,
        data: { information: expect.objectContaining(mockInformation) },
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return INFORMATION_NOT_FOUND when information does not exist',
        input: mockGetInfoInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.INFORMATION_NOT_FOUND,
          errorMessage: ErrorMessage.INFORMATION_NOT_FOUND,
        },
      },
      {
        name: 'should return FORBIDDEN_INFORMATION when non-MANAGER accesses MANAGER target info',
        input: {
          ...mockGetInfoInput,
          user: { uid: mockUserId, role: UserRole.USER },
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockManagerTargetInfo as any);
        },
        error: {
          statusCode: StatusCode.FORBIDDEN_INFORMATION,
          errorMessage: ErrorMessage.FORBIDDEN_INFORMATION,
        },
      },
      {
        name: 'should handle firestore error',
        input: mockGetInfoInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.CANNOT_GET_INFORMATION,
          errorMessage: ErrorMessage.CANNOT_GET_INFORMATION,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await getInformation(req, res);
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('sendInformation()', () => {
  describe('valid cases', () => {
    test('should send email to each recipient', async () => {
      await sendInformation(mockUsers, mockInformation);

      expect(mockedSendEmail).toHaveBeenCalledTimes(mockUsers.length);
      mockUsers.forEach((user: User) => {
        expect(mockedSendEmail).toHaveBeenCalledWith(
          user.email,
          expect.stringContaining(mockInformation.title),
          expect.any(String),
        );
      });
    });

    test('should filter out users without email before sending', async () => {
      const usersWithMixedEmail = [mockUser, mockUserNoEmail];

      await sendInformation(usersWithMixedEmail, mockInformation);

      expect(mockedSendEmail).toHaveBeenCalledTimes(1);
      expect(mockedSendEmail).toHaveBeenCalledWith(
        mockUser.email,
        expect.any(String),
        expect.any(String),
      );
    });
  });

  describe('error cases', () => {
    test('should throw NO_RECIPIENT_EMAILS when all users have no email', async () => {
      await expect(sendInformation([mockUserNoEmail], mockInformation)).rejects.toThrow(
        ErrorMessage.NO_RECIPIENT_EMAILS,
      );

      expect(mockedSendEmail).not.toHaveBeenCalled();
    });

    test('should throw NO_RECIPIENT_EMAILS when users list is empty', async () => {
      await expect(sendInformation([], mockInformation)).rejects.toThrow(
        ErrorMessage.NO_RECIPIENT_EMAILS,
      );
    });

    test('should throw SEND_INFORMATION_FAILED when sendEmail throws', async () => {
      mockedSendEmail.mockRejectedValue(new Error('SMTP error'));

      await expect(sendInformation(mockUsers, mockInformation)).rejects.toThrow(
        ErrorMessage.SEND_INFORMATION_FAILED,
      );
    });
  });
});
