import { prisma } from '../lib/prisma';

export const companyRepository = {
  getMainAddress(companyId: string) {
    return prisma.companyAddress.findFirst({
      where: {
        companyId,
        isMain: true
      },
      include: {
        company: true,
        address: true
      }
    });
  },

  updateMainAddress(companyId: string, addressId: string, data: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    country: string;
    latitude?: number | null;
    longitude?: number | null;
    formattedAddress: string;
  }) {
    return prisma.address.update({
      where: { id: addressId },
      data: {
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement,
        district: data.district,
        city: data.city,
        state: data.state,
        country: data.country,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        formattedAddress: data.formattedAddress
      }
    });
  }
};
