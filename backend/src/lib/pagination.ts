import { z } from 'zod'

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

export const offsetFor = (page: number, pageSize: number) => (page - 1) * pageSize

/** Builds the { items, total, page, pageSize } response model for any item schema. */
export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
  })

// Prisma's `contains` does not escape LIKE wildcards, so a search for "%" or "_" would match everything.
// Backslash is Postgres's default LIKE escape character.
export const escapeLike = (value: string) => value.replace(/[\\%_]/g, (ch) => `\\${ch}`)
