import { UserRole } from '../../constants/enum';

type MockReqOptions = {
  query?: any;
  user?: { uid?: string; role?: UserRole };
  params?: any;
  body?: any;
  pagination?: any;
  headers?: any;
  socket?: any;
  files?: any;
};

export const mockReq = ({
  query = {},
  user = { uid: '2Wv3zE7vsianIJyrafPFJ98YWSj2', role: UserRole.USER },
  params = {},
  body = {},
  pagination = { page: 1, page_size: 10 },
  headers = {},
  socket = { remoteAddress: '127.0.0.1' },
  files = [],
}: MockReqOptions = {}) =>
  ({
    query,
    params,
    body,
    user,
    pagination,
    headers,
    socket,
    files: files === null ? undefined : files,
  }) as any;

export const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockImplementation((data) => data);
  res.redirect = jest.fn().mockImplementation((url) => url);
  res.send = jest.fn().mockImplementation((data) => data);

  return res;
};
