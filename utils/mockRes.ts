import { Response } from 'express';

export function mockRes() {
  let capturedData: any = null;
  let capturedStatus: number = 200;
  const res = {
    status(code: number) {
      capturedStatus = code;
      return res;
    },
    json(data: any) {
      capturedData = data;
      return res;
    },
    send(data: any) {
      capturedData = data;
      return res;
    },

    getData: () => capturedData,
    getStatus: () => capturedStatus,
  } as unknown as Response & { getData: () => any; getStatus: () => number };

  return res;
}
