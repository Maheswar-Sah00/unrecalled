import { BacktestView } from "@/components/unrecalled/BacktestView";
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: `Backtest · ${APP_TITLE}` }];
}

export default function BacktestRoute() {
  return <BacktestView />;
}
