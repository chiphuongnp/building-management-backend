jest.mock('../../utils', () => {
  const { utilMock } = require('../helpers/utilMock');
  return utilMock({
    capitalizeName: jest.fn(),
  })();
});
import { getDishes, getDishById, createDish, updateDish } from '../../services/dish';
import { ErrorMessage, StatusCode } from '../../constants/message';
import { firebaseHelper, deleteImages, capitalizeName } from '../../utils';
import { mockReq, mockRes } from '../helpers/httpMock';
import {
  mockRestaurantId,
  mockDish,
  mockDishes,
  mockGetDishesInput,
  mockGetDishByIdInput,
  mockCreateDishInput,
  mockUpdateDishInput,
} from '../data/dish.mock';

const mockedFirebase = jest.mocked(firebaseHelper);
const mockedDeleteImages = jest.mocked(deleteImages);
const mockedCapitalizeName = jest.mocked(capitalizeName);

beforeEach(() => {
  jest.clearAllMocks();

  mockedCapitalizeName.mockImplementation((name: string) => name);
});

describe('getDishes()', () => {
  describe('valid cases', () => {
    const validCases = [
      {
        name: 'should return all dishes without filters',
        input: mockGetDishesInput,
        mockFire: () => {
          mockedFirebase.countAllDocs.mockResolvedValue(2);
          mockedFirebase.getAllDocs.mockResolvedValue(mockDishes as any);
        },
        expected: {
          dishes: mockDishes,
          pagination: { page: 1, page_size: 10, total: 2, total_page: 1 },
        },
      },
      {
        name: 'should return filtered dishes by category',
        input: { ...mockGetDishesInput, query: { category: 'Japanese' } },
        mockFire: () => {
          mockedFirebase.countDocsByFields.mockResolvedValue(2);
          mockedFirebase.getDocsByFields.mockResolvedValue(mockDishes as any);
        },
        expected: {
          dishes: mockDishes,
          pagination: { page: 1, page_size: 10, total: 2, total_page: 1 },
        },
      },
      {
        name: 'should return filtered dishes by status',
        input: { ...mockGetDishesInput, query: { status: 'active' } },
        mockFire: () => {
          mockedFirebase.countDocsByFields.mockResolvedValue(2);
          mockedFirebase.getDocsByFields.mockResolvedValue(mockDishes as any);
        },
        expected: {
          dishes: mockDishes,
          pagination: { page: 1, page_size: 10, total: 2, total_page: 1 },
        },
      },
      {
        name: 'should return filtered dishes by name using capitalizeName',
        input: { ...mockGetDishesInput, query: { name: 'sushi' } },
        mockFire: () => {
          mockedCapitalizeName.mockReturnValue('Sushi');
          mockedFirebase.countDocsByFields.mockResolvedValue(1);
          mockedFirebase.getDocsByFields.mockResolvedValue([mockDish] as any);
        },
        expected: {
          dishes: [mockDish],
          pagination: { page: 1, page_size: 10, total: 1, total_page: 1 },
        },
      },
      {
        name: 'should handle order and order_by query params',
        input: { ...mockGetDishesInput, query: { order: 'asc', order_by: 'name' } },
        mockFire: () => {
          mockedFirebase.countAllDocs.mockResolvedValue(2);
          mockedFirebase.getAllDocs.mockResolvedValue(mockDishes as any);
        },
        expected: {
          dishes: mockDishes,
          pagination: { page: 1, page_size: 10, total: 2, total_page: 1 },
        },
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire, expected }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await getDishes(req, res, jest.fn());
      expect(response).toEqual({
        success: true,
        data: {
          dishes: expected.dishes,
          pagination: expected.pagination,
        },
      });
    });
  });

  describe('edge cases', () => {
    describe('pagination', () => {
      const edgeCases = [
        {
          name: 'should handle missing pagination',
          input: { ...mockGetDishesInput, pagination: undefined },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(2);
            mockedFirebase.getAllDocs.mockResolvedValue(mockDishes as any);
          },
          expected: {
            dishes: mockDishes,
            pagination: { page: 1, page_size: 10, total: 2, total_page: 1 },
          },
        },
        {
          name: 'should handle null pagination',
          input: { ...mockGetDishesInput, pagination: null },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(3);
            mockedFirebase.getAllDocs.mockResolvedValue(mockDishes as any);
          },
          expected: {
            dishes: mockDishes,
            pagination: { page: undefined, page_size: undefined, total: 3, total_page: 1 },
          },
        },
        {
          name: 'should calculate totalPage correctly',
          input: { ...mockGetDishesInput, pagination: { page: 1, page_size: 1 } },
          mockFire: () => {
            mockedFirebase.countAllDocs.mockResolvedValue(5);
            mockedFirebase.getAllDocs.mockResolvedValue([mockDish] as any);
          },
          expected: {
            dishes: [mockDish],
            pagination: { page: 1, page_size: 1, total: 5, total_page: 5 },
          },
        },
      ];

      test.each(edgeCases)('$name', async ({ input, mockFire, expected }) => {
        const req = mockReq(input);
        const res = mockRes();

        mockFire();

        const response = await getDishes(req, res, jest.fn());
        expect(response).toEqual({
          success: true,
          data: {
            dishes: expected.dishes,
            pagination: expected.pagination,
          },
        });
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return DISH_NOT_FOUND when dishes list is empty',
        input: mockGetDishesInput,
        mockFire: () => {
          mockedFirebase.countAllDocs.mockResolvedValue(0);
          mockedFirebase.getAllDocs.mockResolvedValue([]);
        },
        error: {
          statusCode: StatusCode.DISH_NOT_FOUND,
          errorMessage: ErrorMessage.DISH_NOT_FOUND,
        },
      },
      {
        name: 'should handle firestore error',
        input: mockGetDishesInput,
        mockFire: () => {
          mockedFirebase.countAllDocs.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.CANNOT_GET_DISH_LIST,
          errorMessage: ErrorMessage.CANNOT_GET_DISH_LIST,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await getDishes(req, res, jest.fn());
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('getDishById()', () => {
  describe('valid cases', () => {
    test('should return dish detail', async () => {
      const req = mockReq(mockGetDishByIdInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockDish as any);

      const response = await getDishById(req, res, jest.fn());
      expect(response).toEqual({
        success: true,
        data: { dish: expect.objectContaining(mockDish) },
      });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return DISH_NOT_FOUND when dish does not exist',
        input: { params: { restaurantId: mockRestaurantId, id: 'nonexistent_id' } },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.DISH_NOT_FOUND,
          errorMessage: ErrorMessage.DISH_NOT_FOUND,
        },
      },
      {
        name: 'should handle firestore error',
        input: mockGetDishByIdInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.CANNOT_GET_DISH_DETAIL,
          errorMessage: ErrorMessage.CANNOT_GET_DISH_DETAIL,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await getDishById(req, res, jest.fn());
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('createDish()', () => {
  describe('valid cases - response', () => {
    test('should create dish successfully and return new id', async () => {
      const req = mockReq(mockCreateDishInput);
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValue([]);
      mockedFirebase.createDoc.mockResolvedValue({ id: 'dish_new' } as any);

      const response = await createDish(req, res, jest.fn());
      expect(response).toEqual({
        success: true,
        data: { id: 'dish_new' },
      });
    });
  });

  describe('valid cases - image_urls mapping', () => {
    const validCases = [
      {
        name: 'should normalize backslash paths',
        input: {
          ...mockUpdateDishInput,
          files: [{ path: 'uploads\\sushi.jpg' }, { path: 'uploads/ramen.jpg' }],
        },
        expected: ['uploads/sushi.jpg', 'uploads/ramen.jpg'],
      },
      {
        name: 'should set image_urls to empty array when files is undefined',
        input: { ...mockUpdateDishInput, files: undefined },
        expected: [],
      },
      {
        name: 'should set image_urls to empty array when files is empty',
        input: { ...mockUpdateDishInput, files: [] },
        expected: [],
      },
      {
        name: 'should set image_urls to empty array when files is null',
        input: { ...mockUpdateDishInput, files: null },
        expected: [],
      },
    ];

    test.each(validCases)('$name', async ({ input, expected }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValue([]);
      mockedFirebase.createDoc.mockResolvedValue({ id: 'dish_new' } as any);

      await createDish(req, res, jest.fn());

      expect(mockedFirebase.createDoc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          image_urls: expected,
        }),
      );
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return DISH_NAME_EXISTS when dish name already exists',
        mockFire: () => {
          mockedFirebase.getDocByField.mockResolvedValue([mockDish] as any);
        },
        error: {
          statusCode: StatusCode.DISH_NAME_EXISTS,
          errorMessage: ErrorMessage.DISH_NAME_EXISTS,
        },
      },
      {
        name: 'should handle firestore error',
        mockFire: () => {
          mockedFirebase.getDocByField.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.CANNOT_CREATE_DISH,
          errorMessage: ErrorMessage.CANNOT_CREATE_DISH,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq(mockCreateDishInput);
      const res = mockRes();

      mockFire();

      const response = await createDish(req, res, jest.fn());
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});

describe('updateDish()', () => {
  describe('valid cases', () => {
    test('should update dish successfully', async () => {
      const req = mockReq(mockUpdateDishInput);
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockDish as any);
      mockedFirebase.getDocByField.mockResolvedValue([mockDish] as any);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);

      const response = await updateDish(req, res, jest.fn());
      expect(response).toEqual({
        success: true,
        data: { id: mockDish.id },
      });
    });

    test('should update without name check when name is not provided', async () => {
      const req = mockReq({
        ...mockUpdateDishInput,
        body: { category: 'Korean' },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockDish as any);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);

      const response = await updateDish(req, res, jest.fn());

      expect(response).toEqual({
        success: true,
        data: { id: mockDish.id },
      });
      expect(mockedFirebase.getDocByField).not.toHaveBeenCalled();
    });
  });

  describe('image_urls handling - deleteImages', () => {
    test('should call deleteImages when images are removed', async () => {
      const oldUrls = ['https://cdn.example.com/sushi.jpg', 'https://cdn.example.com/old.jpg'];
      const keptUrl = 'https://cdn.example.com/sushi.jpg';

      const req = mockReq({
        ...mockUpdateDishInput,
        body: { ...mockUpdateDishInput.body, image_urls: [keptUrl] },
        files: [],
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue({
        ...mockDish,
        image_urls: oldUrls,
      } as any);

      mockedFirebase.getDocByField.mockResolvedValue([mockDish] as any);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
      mockedDeleteImages.mockResolvedValue(undefined as any);

      await updateDish(req, res, jest.fn());

      expect(mockedDeleteImages).toHaveBeenCalledWith(['https://cdn.example.com/old.jpg']);
    });

    test('should not call deleteImages when all images are retained', async () => {
      const urls = ['https://cdn.example.com/sushi.jpg'];

      const req = mockReq({
        ...mockUpdateDishInput,
        body: { ...mockUpdateDishInput.body, image_urls: urls },
        files: [],
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue({
        ...mockDish,
        image_urls: urls,
      } as any);

      mockedFirebase.getDocByField.mockResolvedValue([mockDish] as any);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);

      await updateDish(req, res, jest.fn());

      expect(mockedDeleteImages).not.toHaveBeenCalled();
    });

    test('should not call deleteImages when dish.image_urls is undefined', async () => {
      const req = mockReq({
        ...mockUpdateDishInput,
        body: { ...mockUpdateDishInput.body, image_urls: [] },
        files: [],
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue({
        ...mockDish,
        image_urls: undefined,
      } as any);

      mockedFirebase.getDocByField.mockResolvedValue([mockDish] as any);
      mockedFirebase.updateDoc.mockResolvedValue(undefined as any);

      await updateDish(req, res, jest.fn());

      expect(mockedDeleteImages).not.toHaveBeenCalled();
    });
  });

  describe('image_urls handling - update', () => {
    const validCases = [
      {
        name: 'should merge old images with new uploaded file when image_urls is undefined',
        input: {
          ...mockUpdateDishInput,
          body: { ...mockUpdateDishInput.body, image_urls: undefined },
          files: [{ path: 'uploads/new.jpg' }],
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockDish as any);
          mockedFirebase.getDocByField.mockResolvedValue([mockDish] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: [...mockDish.image_urls, 'uploads/new.jpg'],
      },
      {
        name: 'should merge body image_urls with new uploaded file',
        input: {
          ...mockUpdateDishInput,
          body: { ...mockUpdateDishInput.body, image_urls: ['https://cdn.example.com/sushi.jpg'] },
          files: [{ path: 'uploads/ramen.jpg' }],
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue({
            ...mockDish,
            image_urls: ['https://cdn.example.com/sushi.jpg', 'https://cdn.example.com/old.jpg'],
          } as any);
          mockedFirebase.getDocByField.mockResolvedValue([mockDish] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: ['https://cdn.example.com/sushi.jpg', 'uploads/ramen.jpg'],
      },
      {
        name: 'should normalize backslash paths',
        input: {
          ...mockUpdateDishInput,
          body: { ...mockUpdateDishInput.body, image_urls: undefined },
          files: [{ path: 'uploads\\new-dish.jpg' }],
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue({
            ...mockDish,
            image_urls: [],
          } as any);
          mockedFirebase.getDocByField.mockResolvedValue([mockDish] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: ['uploads/new-dish.jpg'],
      },
      {
        name: 'should keep old images when files is undefined',
        input: {
          ...mockUpdateDishInput,
          body: { ...mockUpdateDishInput.body, image_urls: undefined },
          files: undefined,
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue({
            ...mockDish,
            image_urls: ['https://cdn.example.com/sushi.jpg'],
          } as any);
          mockedFirebase.getDocByField.mockResolvedValue([mockDish] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: ['https://cdn.example.com/sushi.jpg'],
      },
      {
        name: 'should use body image_urls when files is empty',
        input: {
          ...mockUpdateDishInput,
          body: { ...mockUpdateDishInput.body, image_urls: ['https://cdn.example.com/a.jpg'] },
          files: [],
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue({
            ...mockDish,
            image_urls: ['old.jpg'],
          } as any);
          mockedFirebase.getDocByField.mockResolvedValue([mockDish] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: ['https://cdn.example.com/a.jpg'],
      },
      {
        name: 'should replace old images with new files when body.image_urls is empty array',
        input: {
          ...mockUpdateDishInput,
          body: { ...mockUpdateDishInput.body, image_urls: [] },
          files: [{ path: 'uploads/new.jpg' }],
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue({
            ...mockDish,
            image_urls: ['old.jpg'],
          } as any);
          mockedFirebase.getDocByField.mockResolvedValue([mockDish] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: ['uploads/new.jpg'],
      },
      {
        name: 'should handle multiple uploaded files',
        input: {
          ...mockUpdateDishInput,
          body: { ...mockUpdateDishInput.body, image_urls: undefined },
          files: [{ path: 'uploads/a.jpg' }, { path: 'uploads\\b.jpg' }],
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue({
            ...mockDish,
            image_urls: [],
          } as any);
          mockedFirebase.getDocByField.mockResolvedValue([mockDish] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: ['uploads/a.jpg', 'uploads/b.jpg'],
      },
      {
        name: 'should fallback to empty array when both dish.image_urls and files are undefined',
        input: {
          ...mockUpdateDishInput,
          body: { ...mockUpdateDishInput.body, image_urls: undefined },
          files: undefined,
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue({
            ...mockDish,
            image_urls: undefined,
          } as any);
          mockedFirebase.getDocByField.mockResolvedValue([mockDish] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: [],
      },
      {
        name: 'should treat files = null as empty array (defensive)',
        input: {
          ...mockUpdateDishInput,
          body: { ...mockUpdateDishInput.body, image_urls: undefined },
          files: null,
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue({
            ...mockDish,
            image_urls: ['https://cdn.example.com/sushi.jpg'],
          } as any);
          mockedFirebase.getDocByField.mockResolvedValue([mockDish] as any);
          mockedFirebase.updateDoc.mockResolvedValue(undefined as any);
        },
        expected: ['https://cdn.example.com/sushi.jpg'],
      },
    ];

    test.each(validCases)('$name', async ({ input, mockFire, expected }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      await updateDish(req, res, jest.fn());

      expect(mockedFirebase.updateDoc).toHaveBeenCalledWith(
        expect.any(String),
        mockDish.id,
        expect.objectContaining({
          image_urls: expected,
        }),
      );
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return DISH_NOT_FOUND when dish does not exist',
        input: {
          ...mockUpdateDishInput,
          params: { restaurantId: mockRestaurantId, id: 'nonexistent_id' },
        },
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(null as any);
        },
        error: {
          statusCode: StatusCode.DISH_NOT_FOUND,
          errorMessage: ErrorMessage.DISH_NOT_FOUND,
        },
      },
      {
        name: 'should return DISH_NAME_EXISTS when name belongs to another dish',
        input: mockUpdateDishInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockResolvedValue(mockDish as any);
          mockedFirebase.getDocByField.mockResolvedValue([
            { ...mockDish, id: 'dish_other' },
          ] as any);
        },
        error: {
          statusCode: StatusCode.DISH_NAME_EXISTS,
          errorMessage: ErrorMessage.DISH_NAME_EXISTS,
        },
      },
      {
        name: 'should handle firestore error',
        input: mockUpdateDishInput,
        mockFire: () => {
          mockedFirebase.getDocById.mockRejectedValue(new Error('firestore error'));
        },
        error: {
          statusCode: StatusCode.CANNOT_UPDATE_DISH,
          errorMessage: ErrorMessage.CANNOT_UPDATE_DISH,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ input, mockFire, error }) => {
      const req = mockReq(input);
      const res = mockRes();

      mockFire();

      const response = await updateDish(req, res, jest.fn());
      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });
  });
});
