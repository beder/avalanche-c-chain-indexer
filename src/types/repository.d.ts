export declare namespace RepositoryTypes {
  type Direction = "forward" | "backward";

  interface Pagination {
    cursor?: string;
    pageSize?: number;
    direction?: Direction;
  }
}
