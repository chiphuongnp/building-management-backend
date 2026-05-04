jest.mock('../../utils', () => {
  const { utilMock } = require('../helpers/utilMock');
  return utilMock({
    deleteImages: jest.fn(),
  })();
});

import {
  getMenuSchedules,
  getMenuScheduleById,
  createMenuSchedule,
  addMenuItem,
  updateMenuItem,
} from '../../services/menu';
import { ErrorMessage, StatusCode } from '../../constants/message';
import { DayOfWeek } from '../../constants/enum';
import { firebaseHelper, deleteImages } from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import {
  mockUserId,
  mockItemId,
  mockDayId,
  mockMenuItem,
  mockMenuItems,
  mockMenuSchedule,
  mockGetMenuSchedulesInput,
  mockGetMenuScheduleByIdInput,
  mockCreateMenuScheduleInput,
  mockAddMenuItemInput,
  mockUpdateMenuItemInput,
} from '../data/menu.mock';

const mockedFirebase = jest.mocked(firebaseHelper);
const mockedDeleteImages = jest.mocked(deleteImages);

describe('getMenuSchedules()', () => {
  const daysOrder = Object.values(DayOfWeek);

  describe('valid cases', () => {
    test('should return schedules with items for all days', async () => {
      const req = mockReq(mockGetMenuSchedulesInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockMenuSchedule as any);
      mockedFirebase.getAllDocs.mockResolvedValue(mockMenuItems as any);

      const response = await getMenuSchedules(req, res, jest.fn());
      expect(response).toEqual({
        success: true,
        data: {
          schedules: expect.arrayContaining([expect.objectContaining({ items: mockMenuItems })]),
        },
      });
      expect(mockedFirebase.getDocById).toHaveBeenCalledTimes(daysOrder.length);
      expect(mockedFirebase.getAllDocs).toHaveBeenCalledTimes(daysOrder.length);
    });

    test('should return schedule with MENU_SCHEDULE_NOT_FOUND message when day schedule not found', async () => {
      const req = mockReq(mockGetMenuSchedulesInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null as any);

      const response = await getMenuSchedules(req, res, jest.fn());
      expect(response).toEqual({
        success: true,
        data: {
          schedules: expect.arrayContaining([
            expect.objectContaining({ message: ErrorMessage.MENU_SCHEDULE_NOT_FOUND }),
          ]),
        },
      });
      expect(mockedFirebase.getAllDocs).not.toHaveBeenCalled();
    });

    test('should return schedule with MENU_SCHEDULE_EMPTY message when day has no items', async () => {
      const req = mockReq(mockGetMenuSchedulesInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockMenuSchedule as any);
      mockedFirebase.getAllDocs.mockResolvedValue([]);

      const response = await getMenuSchedules(req, res, jest.fn());
      expect(response).toEqual({
        success: true,
        data: {
          schedules: expect.arrayContaining([
            expect.objectContaining({ message: ErrorMessage.MENU_SCHEDULE_EMPTY }),
          ]),
        },
      });
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq(mockGetMenuSchedulesInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error'));

      const response = await getMenuSchedules(req, res, jest.fn());
      expect(response).toEqual({
        success: false,
        status: StatusCode.GET_MENU_SCHEDULES,
        message: ErrorMessage.GET_MENU_SCHEDULES,
      });
    });
  });
});

describe('getMenuScheduleById()', () => {
  describe('valid cases', () => {
    test('should return schedule with items', async () => {
      const req = mockReq(mockGetMenuScheduleByIdInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockMenuSchedule as any);
      mockedFirebase.getAllDocs.mockResolvedValue(mockMenuItems as any);

      const response = await getMenuScheduleById(req, res, jest.fn());
      expect(response).toEqual({
        success: true,
        data: {
          schedule: expect.objectContaining({ ...mockMenuSchedule, items: mockMenuItems }),
        },
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return MENU_SCHEDULE_NOT_FOUND when schedule does not exist',
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.MENU_SCHEDULE_NOT_FOUND,
          errorMessage: ErrorMessage.MENU_SCHEDULE_NOT_FOUND,
        },
      },
      {
        name: 'should return MENU_SCHEDULE_EMPTY when schedule has no items',
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockMenuSchedule as any);
          mockedFirebase.getAllDocs.mockResolvedValue([]);
        },
        error: {
          statusCode: StatusCode.MENU_SCHEDULE_EMPTY,
          errorMessage: ErrorMessage.MENU_SCHEDULE_EMPTY,
        },
      },
      {
        name: 'should handle firestore error',
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.GET_MENU_SCHEDULES,
          errorMessage: ErrorMessage.GET_MENU_SCHEDULES,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq(mockGetMenuScheduleByIdInput);
      const res = mockRes();

      mockFire();

      const response = await getMenuScheduleById(req, res, jest.fn());
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('createMenuSchedule()', () => {
  describe('valid cases - response', () => {
    test('should create new schedule and items when day does not exist', async () => {
      const req = mockReq(mockCreateMenuScheduleInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null as any);
      mockedFirebase.createDoc.mockResolvedValue({ id: mockDayId } as any);
      mockedFirebase.getAllDocs.mockResolvedValue([]);
      mockedFirebase.createBatchDocs.mockResolvedValue(undefined as any);

      const response = await createMenuSchedule(req, res, jest.fn());
      expect(response).toEqual({
        success: true,
        data: { created_ids: [mockDayId] },
      });
      expect(mockedFirebase.createDoc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ id: mockDayId, created_by: mockUserId }),
      );
    });

    test('should skip createDoc for schedule when day already exists', async () => {
      const req = mockReq(mockCreateMenuScheduleInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockMenuSchedule as any);
      mockedFirebase.getAllDocs.mockResolvedValue([]);
      mockedFirebase.createBatchDocs.mockResolvedValue(undefined as any);

      await createMenuSchedule(req, res, jest.fn());

      expect(mockedFirebase.createDoc).not.toHaveBeenCalled();
    });

    test('should return empty created_ids when all items already exist', async () => {
      const req = mockReq(mockCreateMenuScheduleInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockMenuSchedule as any);
      mockedFirebase.getAllDocs.mockResolvedValue([{ name: 'Sushi' }, { name: 'Ramen' }] as any);

      const response = await createMenuSchedule(req, res, jest.fn());
      expect(response).toEqual({
        success: true,
        data: { created_ids: [] },
      });
      expect(mockedFirebase.createBatchDocs).not.toHaveBeenCalled();
    });

    test('should filter duplicate names and only create new items', async () => {
      const req = mockReq(mockCreateMenuScheduleInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null as any);
      mockedFirebase.createDoc.mockResolvedValue({ id: mockDayId } as any);
      mockedFirebase.getAllDocs.mockResolvedValue([{ name: 'Sushi' }] as any);
      mockedFirebase.createBatchDocs.mockResolvedValue(undefined as any);

      await createMenuSchedule(req, res, jest.fn());

      expect(mockedFirebase.createBatchDocs).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.objectContaining({ name: 'Ramen' })]),
      );
      expect(mockedFirebase.createBatchDocs).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.arrayContaining([expect.objectContaining({ name: 'Sushi' })]),
      );
    });

    test('should handle multiple schedules and return all created_ids', async () => {
      const req = mockReq({
        ...mockCreateMenuScheduleInput,
        body: {
          schedules: [
            { id: DayOfWeek.MONDAY, items: [{ name: 'Sushi', price: 15 }] },
            { id: DayOfWeek.TUESDAY, items: [{ name: 'Ramen', price: 12 }] },
          ],
        },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null as any);
      mockedFirebase.createDoc.mockResolvedValue({ id: 'day_id' } as any);
      mockedFirebase.getAllDocs.mockResolvedValue([]);
      mockedFirebase.createBatchDocs.mockResolvedValue(undefined as any);

      const response = await createMenuSchedule(req, res, jest.fn());
      expect(response).toEqual({
        success: true,
        data: { created_ids: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY] },
      });
    });
  });

  describe('error cases', () => {
    test('should handle firestore error', async () => {
      const req = mockReq(mockCreateMenuScheduleInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error'));

      const response = await createMenuSchedule(req, res, jest.fn());
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_CREATE_MENU_SCHEDULE,
        message: ErrorMessage.CANNOT_CREATE_MENU_SCHEDULE,
      });
    });
  });
});

describe('addMenuItem()', () => {
  describe('valid cases - response', () => {
    test('should add menu item successfully', async () => {
      const req = mockReq(mockAddMenuItemInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockMenuSchedule as any);
      mockedFirebase.getAllDocs.mockResolvedValue([]);
      mockedFirebase.createDoc.mockResolvedValue({ id: mockItemId } as any);

      const response = await addMenuItem(req, res, jest.fn());
      expect(response).toEqual({
        success: true,
        data: expect.objectContaining({
          dayId: mockDayId,
          id: mockItemId,
          name: mockAddMenuItemInput.body.name,
        }),
      });
    });
  });

  describe('valid cases - image_urls mapping', () => {
    const validCases = [
      {
        name: 'should normalize backslash paths when files are provided',
        input: {
          ...mockAddMenuItemInput,
          files: [{ path: 'uploads\\tempura.jpg' }, { path: 'uploads/ramen.jpg' }],
        },
        expected: ['uploads/tempura.jpg', 'uploads/ramen.jpg'],
      },
      {
        name: 'should use body image_urls when no files uploaded',
        input: {
          ...mockAddMenuItemInput,
          body: {
            ...mockAddMenuItemInput.body,
            image_urls: ['https://cdn.example.com/existing.jpg'],
          },
          files: [],
        },
        expected: ['https://cdn.example.com/existing.jpg'],
      },
      {
        name: 'should set image_urls to empty array when no files and no body image_urls',
        input: {
          ...mockAddMenuItemInput,
          body: { ...mockAddMenuItemInput.body, image_urls: undefined },
          files: [],
        },
        expected: [],
      },
    ];

    test.each(validCases)('$name', async ({ input, expected }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockMenuSchedule as any);
      mockedFirebase.getAllDocs.mockResolvedValue([]);
      mockedFirebase.createDoc.mockResolvedValue({ id: mockItemId } as any);

      await addMenuItem(req, res, jest.fn());

      expect(mockedFirebase.createDoc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ image_urls: expected }),
      );
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return MENU_SCHEDULE_NOT_FOUND when schedule does not exist',
        input: mockAddMenuItemInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.MENU_SCHEDULE_NOT_FOUND,
          errorMessage: ErrorMessage.MENU_SCHEDULE_NOT_FOUND,
        },
      },
      {
        name: 'should return MENU_ITEM_NAME_EXISTS when item name already exists',
        input: mockAddMenuItemInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockMenuSchedule as any);
          mockedFirebase.getAllDocs.mockResolvedValue([{ name: 'Tempura' }] as any);
        },
        error: {
          statusCode: StatusCode.MENU_ITEM_NAME_EXISTS,
          errorMessage: ErrorMessage.MENU_ITEM_NAME_EXISTS,
        },
      },
      {
        name: 'should handle firestore error',
        input: mockAddMenuItemInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.CANNOT_CREATE_MENU_ITEM,
          errorMessage: ErrorMessage.CANNOT_CREATE_MENU_ITEM,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await addMenuItem(req, res, jest.fn());
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('updateMenuItem()', () => {
  describe('valid cases', () => {
    test('should update menu item successfully', async () => {
      const req = mockReq(mockUpdateMenuItemInput);
      const res = mockRes();

      mockedFirebase.getDocById
        .mockResolvedValueOnce(mockMenuSchedule as any)
        .mockResolvedValueOnce(mockMenuItem as any);
      mockedFirebase.getAllDocs.mockResolvedValue([mockMenuItem] as any);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);

      const response = await updateMenuItem(req, res, jest.fn());
      expect(response).toEqual({
        success: true,
        data: { dayId: mockDayId, id: mockItemId },
      });
    });

    test('should update without name check when name is not provided', async () => {
      const req = mockReq({ ...mockUpdateMenuItemInput, body: { price: 25 } });
      const res = mockRes();

      mockedFirebase.getDocById
        .mockResolvedValueOnce(mockMenuSchedule as any)
        .mockResolvedValueOnce(mockMenuItem as any);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);

      const response = await updateMenuItem(req, res, jest.fn());
      expect(response).toEqual({
        success: true,
        data: { dayId: mockDayId, id: mockItemId },
      });
      expect(mockedFirebase.getAllDocs).not.toHaveBeenCalled();
    });
  });

  describe('image_urls handling - deleteImages', () => {
    test('should call deleteImages with removed urls', async () => {
      const oldUrls = ['https://cdn.example.com/sushi.jpg', 'https://cdn.example.com/old.jpg'];
      const keptUrl = 'https://cdn.example.com/sushi.jpg';

      const req = mockReq({
        ...mockUpdateMenuItemInput,
        body: { ...mockUpdateMenuItemInput.body, image_urls: [keptUrl] },
        files: [],
      });
      const res = mockRes();

      mockedFirebase.getDocById
        .mockResolvedValueOnce(mockMenuSchedule as any)
        .mockResolvedValueOnce({ ...mockMenuItem, image_urls: oldUrls } as any);
      mockedFirebase.getAllDocs.mockResolvedValue([mockMenuItem] as any);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
      mockedDeleteImages.mockResolvedValue(undefined as any);

      await updateMenuItem(req, res, jest.fn());

      expect(mockedDeleteImages).toHaveBeenCalledWith(['https://cdn.example.com/old.jpg']);
    });

    test('should not call deleteImages when all images are retained', async () => {
      const urls = ['https://cdn.example.com/sushi.jpg'];

      const req = mockReq({
        ...mockUpdateMenuItemInput,
        body: { ...mockUpdateMenuItemInput.body, image_urls: urls },
        files: [],
      });
      const res = mockRes();

      mockedFirebase.getDocById
        .mockResolvedValueOnce(mockMenuSchedule as any)
        .mockResolvedValueOnce({ ...mockMenuItem, image_urls: urls } as any);
      mockedFirebase.getAllDocs.mockResolvedValue([mockMenuItem] as any);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);

      await updateMenuItem(req, res, jest.fn());

      expect(mockedDeleteImages).not.toHaveBeenCalled();
    });

    test('should not call deleteImages when item.image_urls is undefined', async () => {
      const req = mockReq({
        ...mockUpdateMenuItemInput,
        body: { ...mockUpdateMenuItemInput.body, image_urls: [] },
        files: [],
      });
      const res = mockRes();

      mockedFirebase.getDocById
        .mockResolvedValueOnce(mockMenuSchedule as any)
        .mockResolvedValueOnce({ ...mockMenuItem, image_urls: undefined } as any);
      mockedFirebase.getAllDocs.mockResolvedValue([mockMenuItem] as any);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);

      await updateMenuItem(req, res, jest.fn());

      expect(mockedDeleteImages).not.toHaveBeenCalled();
    });
  });

  describe('image_urls handling - update', () => {
    const validCases = [
      {
        name: 'should merge old images with new uploaded file when image_urls is undefined',
        input: {
          ...mockUpdateMenuItemInput,
          body: { ...mockUpdateMenuItemInput.body, image_urls: undefined },
          files: [{ path: 'uploads/new.jpg' }],
        },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockMenuSchedule as any)
            .mockResolvedValueOnce({
              ...mockMenuItem,
              image_urls: ['https://cdn.example.com/sushi.jpg'],
            } as any);
          mockedFirebase.getAllDocs.mockResolvedValue([mockMenuItem] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: ['https://cdn.example.com/sushi.jpg', 'uploads/new.jpg'],
      },
      {
        name: 'should merge body image_urls with new uploaded file',
        input: {
          ...mockUpdateMenuItemInput,
          body: {
            ...mockUpdateMenuItemInput.body,
            image_urls: ['https://cdn.example.com/sushi.jpg'],
          },
          files: [{ path: 'uploads/ramen.jpg' }],
        },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockMenuSchedule as any)
            .mockResolvedValueOnce({
              ...mockMenuItem,
              image_urls: ['https://cdn.example.com/sushi.jpg', 'https://cdn.example.com/old.jpg'],
            } as any);
          mockedFirebase.getAllDocs.mockResolvedValue([mockMenuItem] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: ['https://cdn.example.com/sushi.jpg', 'uploads/ramen.jpg'],
      },
      {
        name: 'should normalize backslash paths in new uploaded files',
        input: {
          ...mockUpdateMenuItemInput,
          body: { ...mockUpdateMenuItemInput.body, image_urls: undefined },
          files: [{ path: 'uploads\\new.jpg' }],
        },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockMenuSchedule as any)
            .mockResolvedValueOnce({ ...mockMenuItem, image_urls: [] } as any);
          mockedFirebase.getAllDocs.mockResolvedValue([mockMenuItem] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: ['uploads/new.jpg'],
      },
      {
        name: 'should keep old images when files is undefined',
        input: {
          ...mockUpdateMenuItemInput,
          body: { ...mockUpdateMenuItemInput.body, image_urls: undefined },
          files: undefined,
        },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockMenuSchedule as any)
            .mockResolvedValueOnce({
              ...mockMenuItem,
              image_urls: ['https://cdn.example.com/sushi.jpg'],
            } as any);
          mockedFirebase.getAllDocs.mockResolvedValue([mockMenuItem] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: ['https://cdn.example.com/sushi.jpg'],
      },
      {
        name: 'should replace old images with new files when body.image_urls is empty array',
        input: {
          ...mockUpdateMenuItemInput,
          body: { ...mockUpdateMenuItemInput.body, image_urls: [] },
          files: [{ path: 'uploads/new.jpg' }],
        },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockMenuSchedule as any)
            .mockResolvedValueOnce({ ...mockMenuItem, image_urls: ['old.jpg'] } as any);
          mockedFirebase.getAllDocs.mockResolvedValue([mockMenuItem] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
          mockedDeleteImages.mockResolvedValue(undefined as any);
        },
        expected: ['uploads/new.jpg'],
      },
      {
        name: 'should use body image_urls when files is empty',
        input: {
          ...mockUpdateMenuItemInput,
          body: { ...mockUpdateMenuItemInput.body, image_urls: ['https://cdn.example.com/a.jpg'] },
          files: [],
        },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockMenuSchedule as any)
            .mockResolvedValueOnce({ ...mockMenuItem, image_urls: ['old.jpg'] } as any);
          mockedFirebase.getAllDocs.mockResolvedValue([mockMenuItem] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
          mockedDeleteImages.mockResolvedValue(undefined as any);
        },
        expected: ['https://cdn.example.com/a.jpg'],
      },
      {
        name: 'should handle multiple uploaded files',
        input: {
          ...mockUpdateMenuItemInput,
          body: { ...mockUpdateMenuItemInput.body, image_urls: undefined },
          files: [{ path: 'uploads/a.jpg' }, { path: 'uploads\\b.jpg' }],
        },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockMenuSchedule as any)
            .mockResolvedValueOnce({ ...mockMenuItem, image_urls: [] } as any);
          mockedFirebase.getAllDocs.mockResolvedValue([mockMenuItem] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: ['uploads/a.jpg', 'uploads/b.jpg'],
      },
      {
        name: 'should fallback to empty array when both item.image_urls and files are undefined',
        input: {
          ...mockUpdateMenuItemInput,
          body: { ...mockUpdateMenuItemInput.body, image_urls: undefined },
          files: undefined,
        },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockMenuSchedule as any)
            .mockResolvedValueOnce({ ...mockMenuItem, image_urls: undefined } as any);
          mockedFirebase.getAllDocs.mockResolvedValue([mockMenuItem] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: [],
      },
      {
        name: 'should set newImages to empty array when files is null',
        input: {
          ...mockUpdateMenuItemInput,
          body: { ...mockUpdateMenuItemInput.body, image_urls: undefined },
          files: null,
        },
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockMenuSchedule as any)
            .mockResolvedValueOnce({
              ...mockMenuItem,
              image_urls: ['https://cdn.example.com/sushi.jpg'],
            } as any);
          mockedFirebase.getAllDocs.mockResolvedValue([mockMenuItem] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: ['https://cdn.example.com/sushi.jpg'],
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire, expected }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      await updateMenuItem(req, res, jest.fn());

      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        expect.any(String),
        mockItemId,
        expect.objectContaining({ image_urls: expected }),
      );
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return MENU_SCHEDULE_NOT_FOUND when schedule does not exist',
        input: mockUpdateMenuItemInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValueOnce(null as any);
        },
        error: {
          statusCode: StatusCode.MENU_SCHEDULE_NOT_FOUND,
          errorMessage: ErrorMessage.MENU_SCHEDULE_NOT_FOUND,
        },
      },
      {
        name: 'should return MENU_ITEM_NOT_FOUND when item does not exist',
        input: mockUpdateMenuItemInput,
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockMenuSchedule as any)
            .mockResolvedValueOnce(null as any);
        },
        error: {
          statusCode: StatusCode.MENU_ITEM_NOT_FOUND,
          errorMessage: ErrorMessage.MENU_ITEM_NOT_FOUND,
        },
      },
      {
        name: 'should return MENU_ITEM_NAME_EXISTS when name belongs to another item',
        input: mockUpdateMenuItemInput,
        mockFire: () => {
          mockedFirebase.getDocById
            .mockResolvedValueOnce(mockMenuSchedule as any)
            .mockResolvedValueOnce(mockMenuItem as any);
          mockedFirebase.getAllDocs.mockResolvedValue([
            { id: 'other_item_id', name: 'Sushi Updated' },
          ] as any);
        },
        error: {
          statusCode: StatusCode.MENU_ITEM_NAME_EXISTS,
          errorMessage: ErrorMessage.MENU_ITEM_NAME_EXISTS,
        },
      },
      {
        name: 'should handle firestore error',
        input: mockUpdateMenuItemInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.CANNOT_UPDATE_MENU_ITEM,
          errorMessage: ErrorMessage.CANNOT_UPDATE_MENU_ITEM,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await updateMenuItem(req, res, jest.fn());
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});
