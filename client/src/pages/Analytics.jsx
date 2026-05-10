import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import {
  getWeeklyApplications,
  getResponseRate,
  getSourceEffectiveness,
  getScamRatio,
} from "@/api/analyticsApi";

const COLORS = ["#0a0a0a", "#a3a3a3", "#d4d4d4"];

function ChartCard({ title, children, isEmpty }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="p-5">
        {isEmpty ? (
          <EmptyState title="No data yet" description="Data will appear once available." />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

const tooltipStyle = {
  fontSize: 12, border: "1px solid #e5e5e5",
  borderRadius: 6, boxShadow: "none",
};

export default function Analytics() {
  const [weeklyApps, setWeeklyApps] = useState([]);
  const [responseRate, setResponseRate] = useState([]);
  const [sourceEff, setSourceEff] = useState([]);
  const [scamRatio, setScamRatio] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [weeklyRes, responseRes, sourceRes, scamRes] = await Promise.all([
          getWeeklyApplications(),
          getResponseRate(),
          getSourceEffectiveness(),
          getScamRatio(),
        ]);
        setWeeklyApps(Array.isArray(weeklyRes) ? weeklyRes : []);
        setResponseRate(Array.isArray(responseRes) ? responseRes : []);
        setSourceEff(Array.isArray(sourceRes) ? sourceRes : []);
        setScamRatio(Array.isArray(scamRes) ? scamRes : []);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading analytics..." />;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartCard title="Applications Per Week" isEmpty={weeklyApps.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={weeklyApps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="applications" fill="#0a0a0a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Response Rate" isEmpty={responseRate.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={responseRate} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
              {responseRate.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Source Effectiveness" isEmpty={sourceEff.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={sourceEff}>
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

      <ChartCard title="Scam Ratio by Source" isEmpty={scamRatio.length === 0}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={scamRatio} layout="vertical">
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
