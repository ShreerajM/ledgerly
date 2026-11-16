import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => (error?.status >= 400 && error?.status < 500 ? false : count < 2),
      refetchOnWindowFocus: false,
    },
  },
})
