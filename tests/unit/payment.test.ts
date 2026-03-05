import { PaymentReferenceType } from '../../constants/enum';
import { buildReferenceContext } from '../../services/payment';

describe('buildReferenceContext()', () => {
  describe('valid cases', () => {
    const testCases = [
      {
        name: 'should return restaurantId when referenceType is ORDER',
        input: {
          referenceType: PaymentReferenceType.ORDER,
          url: 'https://test.com?restaurantId=abc123',
        },
        expected: { restaurantId: 'abc123' },
      },
      {
        name: 'should return buildingId and parkingId when referenceType is PARKING_SUBSCRIPTION',
        input: {
          referenceType: PaymentReferenceType.PARKING_SUBSCRIPTION,
          url: 'https://test.com?buildingId=b1&parkingId=p1',
        },
        expected: { buildingId: 'b1', parkingId: 'p1' },
      },
      {
        name: 'should return null for other referenceTypes',
        input: {
          referenceType: 'UNKNOWN' as any,
          url: 'https://test.com',
        },
        expected: null,
      },
    ];

    test.each(testCases)('$name', ({ input, expected }) => {
      const result = buildReferenceContext(input.referenceType, input.url);
      expect(result).toEqual(expected);
    });
  });

  describe('error cases', () => {
    const errorCases = [
      {
        name: 'should throw when ORDER missing restaurantId',
        referenceType: PaymentReferenceType.ORDER,
        url: 'https://test.com',
      },
      {
        name: 'should throw when PARKING missing buildingId',
        referenceType: PaymentReferenceType.PARKING_SUBSCRIPTION,
        url: 'https://test.com',
      },
      {
        name: 'should throw when PARKING missing parkingId',
        referenceType: PaymentReferenceType.PARKING_SUBSCRIPTION,
        url: 'https://test.com?buildingId=b1',
      },
    ];

    test.each(errorCases)('$name', ({ referenceType, url }) => {
      expect(() => buildReferenceContext(referenceType, url)).toThrow();
    });
  });
});
