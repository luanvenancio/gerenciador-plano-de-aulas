"use client";
import {
  isServer,
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: 5 * (60 * 1000),
      },
    },
    mutationCache: new MutationCache({
      onSuccess: () => {
        const queryClientInstance = getQueryClient();
        queryClientInstance.invalidateQueries();
      },
    }),
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
