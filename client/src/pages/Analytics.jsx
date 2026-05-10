import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  weeklyApplications, responseRateData,
  sourceEffectiveness, scamRatioData,
} from "@/constants/mockAnalytics";

const COLORS = ["#0a0a0a", "#a3a3a3", "#d4d4d4"];

function ChartCard({ title, children }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  fontSize: 12, border: "1px solid #e5e5e5",
  borderRadius: 6, boxShadow: "none",
};

export default function Analytics() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartCard title="Applications Per Week">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={weeklyApplications}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="applications" fill="#0a0a0a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Response Rate">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={responseRateData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
              {responseRateData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Source Effectiveness">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={sourceEffectiveness}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="source" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="applied" fill="#a3a3a3" radius={[4, 4, 0, 0]} />
            <Bar dataKey="responses" fill="#0a0a0a" radius={[4, 4, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Scam Ratio by Source">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={scamRatioData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="source" type="category" tick={{ fontSize: 12 }} width={80} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="legitimate" stackId="a" fill="#0a0a0a" />
            <Bar dataKey="suspicious" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
