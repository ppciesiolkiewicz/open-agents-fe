import type { QueryClient } from "@tanstack/react-query";

/** TanStack Query keys for the agents canvas (graph list + channels). */
export const agentsQueryKey = ["agents"] as const;

export const channelsQueryKey = ["axl", "channels"] as const;

export function invalidateAgentsAndChannelsQueries(
  queryClient: QueryClient,
): void {
  void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
  void queryClient.invalidateQueries({ queryKey: channelsQueryKey });
}
