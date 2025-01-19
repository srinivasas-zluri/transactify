import React from 'react';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationProps{
    page: number;
    prev: { page: number | null };
    next: { page: number | null };
    setPage: React.Dispatch<React.SetStateAction<number>>;
}

export const PaginationComponent = ({ page, prev, next, setPage }: PaginationProps) => {

  return (
    <Pagination>
      <PaginationContent>
        {prev.page != null && (
          <>
            <PaginationPrevious onClick={() => setPage((prev) => prev - 1)} />
            <PaginationItem onClick={() => setPage((prev) => prev - 1)}>
              <PaginationLink>{prev.page}</PaginationLink>
            </PaginationItem>
          </>
        )}
        <PaginationItem className="bg-gray-200 rounded-sm">
          <PaginationLink>{page}</PaginationLink>
        </PaginationItem>
        {next.page != null && (
          <>
            <PaginationItem onClick={() => setPage((prev) => prev + 1)}>
              <PaginationLink>{next.page}</PaginationLink>
            </PaginationItem>
            <PaginationNext onClick={() => setPage((prev) => prev + 1)} />
          </>
        )}
      </PaginationContent>
    </Pagination>
  );
};