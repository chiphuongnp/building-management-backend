import { Timestamp } from 'firebase-admin/firestore';

export const convertTimestamps = (obj: any): any => {
  if (obj instanceof Timestamp) {
    return obj.toDate();
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertTimestamps(item));
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, convertTimestamps(value)]),
    );
  }

  return obj;
};

export const formatToTimestamp = (date: string) => Timestamp.fromDate(new Date(date));
