import { UserRole } from '../../constants/enum';

export const mockReq = (
  query?: any,
  user?: { uid?: string; role?: UserRole },
  params?: any,
  body?: any,
  pagination?: any,
) =>
  ({
    query: query ?? {},
    params: params ?? {},
    body: body ?? {},
    user: {
      uid: user?.uid ?? 'user1',
      role: user?.role ?? UserRole.USER,
    },
    pagination: pagination ?? {
      page: 1,
      page_size: 10,
    },
  }) as any;

export const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockImplementation(function (data) {
    return data;
  });

  return res;
};
