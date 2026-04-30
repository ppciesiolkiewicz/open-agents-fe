import { ZeroGPurchaseStatusEnum } from "@/sdk";

export const STEPS: ReadonlyArray<{
  key: ZeroGPurchaseStatusEnum;
  label: string;
}> = [
  { key: ZeroGPurchaseStatusEnum.Pending, label: "Confirming" },
  { key: ZeroGPurchaseStatusEnum.Bridging, label: "Bridging" },
  { key: ZeroGPurchaseStatusEnum.Swapping, label: "Swapping" },
  { key: ZeroGPurchaseStatusEnum.Sending, label: "Sending" },
  { key: ZeroGPurchaseStatusEnum.ToppingUp, label: "Topping up" },
];

export const STATUS_LABEL: Record<ZeroGPurchaseStatusEnum, string> = {
  [ZeroGPurchaseStatusEnum.Pending]: "Waiting for confirmation",
  [ZeroGPurchaseStatusEnum.Bridging]: "Bridging USDC to Zerog",
  [ZeroGPurchaseStatusEnum.Swapping]: "Swapping USDC for 0G",
  [ZeroGPurchaseStatusEnum.Sending]: "Sending 0G to your wallet",
  [ZeroGPurchaseStatusEnum.ToppingUp]: "Topping up your AI tokens",
  [ZeroGPurchaseStatusEnum.Completed]: "Completed",
  [ZeroGPurchaseStatusEnum.Failed]: "Failed",
};

export function isTerminal(status: ZeroGPurchaseStatusEnum): boolean {
  return (
    status === ZeroGPurchaseStatusEnum.Completed ||
    status === ZeroGPurchaseStatusEnum.Failed
  );
}

export function stepIndex(status: ZeroGPurchaseStatusEnum): number {
  if (status === ZeroGPurchaseStatusEnum.Completed) return STEPS.length;
  if (status === ZeroGPurchaseStatusEnum.Failed) return -1;
  return STEPS.findIndex((s) => s.key === status);
}
