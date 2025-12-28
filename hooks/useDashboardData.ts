import { useState, useEffect } from 'react';

export interface StatItem {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  color: string;
}

export interface ChartDataItem {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ActivityItem {
  user: string;
  action: string;
  time: string;
  type: 'create' | 'generate' | 'update' | 'export';
}

export interface DashboardData {
  stats: StatItem[];
  chartData: ChartDataItem[];
  activities: ActivityItem[];
}

/**
 * Dashboard 数据获取 Hook
 * 自动获取并轮询更新 Dashboard 数据
 */
export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData>({
    stats: [],
    chartData: [],
    activities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 并行请求三个API端点
        const [statsRes, chartRes, activitiesRes] = await Promise.all([
          fetch('/api/dashboard/stats', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('/api/dashboard/chart', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('/api/dashboard/activities', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        // 检查响应状态
        if (!statsRes.ok || !chartRes.ok || !activitiesRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        // 解析响应
        const [stats, chartData, activities] = await Promise.all([
          statsRes.json(),
          chartRes.json(),
          activitiesRes.json()
        ]);

        setData({ stats, chartData, activities });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
        setError(errorMessage);
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    // 立即执行一次
    fetchDashboardData();

    // 设置轮询更新（每30秒）
    const interval = setInterval(fetchDashboardData, 30000);

    // 清理函数
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
};
