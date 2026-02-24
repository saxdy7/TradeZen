import DCACalculator from '@/components/portfolio/DCACalculator';

export const metadata = {
    title: 'DCA Calculator | TradeZen',
    description: 'Simulate Dollar Cost Averaging strategies',
};

export default function DCAPage() {
    return (
        <div className="space-y-4 lg:space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl lg:text-2xl font-bold text-white font-[family-name:var(--font-space-grotesk)]">
                    Dollar Cost Averaging
                </h1>
                <p className="text-xs lg:text-sm text-[#8888AA] mt-1">
                    Backtest DCA strategies against historical market data
                </p>
            </div>

            <DCACalculator />
        </div>
    );
}
