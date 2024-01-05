const defaultPageSize = Number(process.env.DEFAULT_PAGE_SIZE || 100);
const maximumPageSize = Number(process.env.MAXIMUM_PAGE_SIZE || 1000);

export const getPageSize = (pageSize?: number) => {
  if (!pageSize) {
    return defaultPageSize;
  }

  return pageSize > maximumPageSize ? maximumPageSize : pageSize;
};
