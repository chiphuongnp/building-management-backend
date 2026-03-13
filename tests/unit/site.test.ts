import { ErrorMessage, StatusCode } from '../../constants/message';
import { createSite, getSiteById, getSites, updateSite } from '../../services/site';
import { firebaseHelper, logger } from '../../utils/index';
import { mockEmptySites, mockSites } from '../data/site.mock';
import { mockReq, mockRes } from '../helpers/httpMock';

const mockedFirebase = firebaseHelper as jest.Mocked<typeof firebaseHelper>;
const mockedLogger = logger as jest.Mocked<typeof logger>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getSites()', () => {
  describe('valid cases', () => {
    test('should return all sites', async () => {
      const req = mockReq();
      const res = mockRes();

      mockedFirebase.getAllDocs.mockResolvedValue(mockSites);
      const response = await getSites(req, res);

      expect(response).toEqual({ success: true, data: mockSites });
    });

    test('should return empty list when no sites found', async () => {
      const req = mockReq();
      const res = mockRes();

      mockedFirebase.getAllDocs.mockResolvedValue(mockEmptySites);
      const response = await getSites(req, res);

      expect(response).toEqual({ success: true, data: mockEmptySites });
    });
  });

  describe('error cases', () => {
    test('should return error when firebase fails', async () => {
      const req = mockReq();
      const res = mockRes();

      mockedFirebase.getAllDocs.mockRejectedValue(new Error('firebase error'));
      const response = await getSites(req, res);

      expect(mockedLogger.warn).toHaveBeenCalled();
      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_GET_SITE_LIST,
        message: ErrorMessage.CANNOT_GET_SITE_LIST,
      });
    });
  });
});

describe('getSiteById()', () => {
  describe('valid cases', () => {
    test('should return site when site exists', async () => {
      const req = mockReq({ params: { id: 'AjBfMRzDyXC8wbM4KHWb' } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockSites[0]);
      const response = await getSiteById(req, res);

      expect(response).toEqual({ success: true, data: mockSites[0] });
    });
  });

  describe('edge cases', () => {
    test('should handle missing id parameter', async () => {
      const req = mockReq({ params: {} });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null);
      const response = await getSiteById(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.SITE_NOT_FOUND,
        message: ErrorMessage.SITE_NOT_FOUND,
      });
    });
  });

  describe('error cases', () => {
    it('should return error when site not found', async () => {
      const req = mockReq({ params: { id: 'site1' } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null);
      const response = await getSiteById(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.SITE_NOT_FOUND,
        message: ErrorMessage.SITE_NOT_FOUND,
      });
    });

    it('should return error when firebase throws error', async () => {
      const req = mockReq({ params: { id: 'site1' } });
      const res = mockRes();

      mockedFirebase.getDocById.mockRejectedValue(new Error('firebase error'));
      const response = await getSiteById(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.SITE_NOT_FOUND,
        message: ErrorMessage.SITE_NOT_FOUND,
      });
    });
  });
});

describe('createSite()', () => {
  describe('valid cases', () => {
    test('should create site successfully', async () => {
      const req = mockReq({
        body: {
          id: 'AjBfMRzDyXC8wbM4KHWb',
          code: 'TOKYO',
          address: 'Tokyo, Japan',
        },
      });
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockedFirebase.createDoc.mockResolvedValue({ id: 'AjBfMRzDyXC8wbM4KHWb' } as any);
      const response = await createSite(req, res);

      expect(response).toEqual({ success: true, data: { id: 'AjBfMRzDyXC8wbM4KHWb' } });
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should return error when site id already exists',
        mockFire: () =>
          mockedFirebase.getDocByField.mockResolvedValueOnce([{ id: 'AjBfMRzDyXC8wbM4KHWb' }]),
        error: {
          statusCode: StatusCode.SITE_ALREADY_EXISTS,
          errorMessage: ErrorMessage.SITE_ID_ALREADY_EXISTS,
        },
      },
      {
        name: 'should return error when site code already exists',
        mockFire: () =>
          mockedFirebase.getDocByField
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ id: 'AjBfMRzDyXC8wbM4KHWb' }]),
        error: {
          statusCode: StatusCode.SITE_CODE_ALREADY_EXISTS,
          errorMessage: ErrorMessage.SITE_CODE_ALREADY_EXISTS,
        },
      },
    ];

    test.each(errorCases)('$name', async ({ mockFire, error }) => {
      const req = mockReq({
        body: {
          id: 'AjBfMRzDyXC8wbM4KHWb',
          code: 'TOKYO',
        },
      });
      const res = mockRes();

      mockFire();
      const response = await createSite(req, res);

      expect(response).toEqual({
        success: false,
        status: error.statusCode,
        message: error.errorMessage,
      });
    });

    test('should return error when create site fails', async () => {
      const req = mockReq({
        body: {
          id: 'AjBfMRzDyXC8wbM4KHWb',
          code: 'TOKYO',
        },
      });
      const res = mockRes();

      mockedFirebase.getDocByField.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockedFirebase.createDoc.mockRejectedValue(new Error('firebase error'));
      const response = await createSite(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_CREATE_SITE,
        message: ErrorMessage.CANNOT_CREATE_SITE,
      });
    });
  });
});

describe('updateSite()', () => {
  describe('valid cases', () => {
    test('should update site successfully', async () => {
      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { address: 'Osaka, Japan' },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockSites[0]);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);
      const response = await updateSite(req, res);

      expect(response).toEqual({ success: true, data: { id: 'AjBfMRzDyXC8wbM4KHWb' } });
    });

    test('should update site when code exists but belongs to same site', async () => {
      const req = mockReq({ params: { id: 'AjBfMRzDyXC8wbM4KHWb' }, body: { code: 'TOKYO' } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockSites[0]);
      mockedFirebase.getDocByField.mockResolvedValue([mockSites[0]]);
      mockedFirebase.updateDoc.mockResolvedValue({} as any);
      const response = await updateSite(req, res);

      expect(response).toEqual({ success: true, data: { id: 'AjBfMRzDyXC8wbM4KHWb' } });
    });
  });

  describe('error cases', () => {
    test('should return error when site not found', async () => {
      const req = mockReq({ params: { id: 'site_999' }, body: {} });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(null);
      const response = await updateSite(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.SITE_NOT_FOUND,
        message: ErrorMessage.SITE_NOT_FOUND,
      });
    });

    test('should return error when site code already exists', async () => {
      const req = mockReq({ params: { id: 'AjBfMRzDyXC8wbM4KHWb' }, body: { code: 'OSAKA' } });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockSites[0]);
      mockedFirebase.getDocByField.mockResolvedValue([mockSites[1]]);
      const response = await updateSite(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.SITE_CODE_ALREADY_EXISTS,
        message: ErrorMessage.SITE_CODE_ALREADY_EXISTS,
      });
    });

    test('should return error when firebase update fails', async () => {
      const req = mockReq({
        params: { id: 'AjBfMRzDyXC8wbM4KHWb' },
        body: { address: 'Osaka, Japan' },
      });
      const res = mockRes();

      mockedFirebase.getDocById.mockResolvedValue(mockSites[0]);
      mockedFirebase.updateDoc.mockRejectedValue(new Error('firebase error'));
      const response = await updateSite(req, res);

      expect(response).toEqual({
        success: false,
        status: StatusCode.CANNOT_UPDATE_SITE,
        message: ErrorMessage.CANNOT_UPDATE_SITE,
      });
    });
  });
});
