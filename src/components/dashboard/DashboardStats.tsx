import React from "react";
import { Card, CardContent } from "../ui/Card";
import {
  Users,
  Package,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck
} from "lucide-react";
import { DashboardStats as DashboardStatsType } from "../../services/dashboardService";

interface DashboardStatsProps {
  stats: DashboardStatsType;
  isLoading: boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-gray-200 w-12 h-12"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "blue",
      bgColor: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-200",
      iconColor: "text-blue-700",
      textColor: "text-blue-700"
    },
    {
      title: "Total Items",
      value: stats.totalItems,
      icon: Package,
      color: "green",
      bgColor: "from-green-50 to-green-100",
      iconBg: "bg-green-200",
      iconColor: "text-green-700",
      textColor: "text-green-700"
    },
    {
      title: "Total Requests",
      value: stats.totalRequests,
      icon: ClipboardList,
      color: "purple",
      bgColor: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-200",
      iconColor: "text-purple-700",
      textColor: "text-purple-700"
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: "red",
      bgColor: "from-red-50 to-red-100",
      iconBg: "bg-red-200",
      iconColor: "text-red-700",
      textColor: "text-red-700"
    },
    {
      title: "Pending Requests",
      value: stats.requestsByStatus.pending,
      icon: Clock,
      color: "amber",
      bgColor: "from-amber-50 to-amber-100",
      iconBg: "bg-amber-200",
      iconColor: "text-amber-700",
      textColor: "text-amber-700"
    },
    {
      title: "Approved Requests",
      value: stats.requestsByStatus.approved,
      icon: CheckCircle,
      color: "emerald",
      bgColor: "from-emerald-50 to-emerald-100",
      iconBg: "bg-emerald-200",
      iconColor: "text-emerald-700",
      textColor: "text-emerald-700"
    },
    {
      title: "Recent Requests",
      value: stats.recentRequests,
      subtitle: "Last 7 days",
      icon: Calendar,
      color: "indigo",
      bgColor: "from-indigo-50 to-indigo-100",
      iconBg: "bg-indigo-200",
      iconColor: "text-indigo-700",
      textColor: "text-indigo-700"
    },
    {
      title: "Total Quantity",
      value: stats.totalQuantity,
      subtitle: "Items in stock",
      icon: TrendingUp,
      color: "teal",
      bgColor: "from-teal-50 to-teal-100",
      iconBg: "bg-teal-200",
      iconColor: "text-teal-700",
      textColor: "text-teal-700"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card
          key={index}
          variant="3d"
          hover={true}
          className={`bg-gradient-to-br ${stat.bgColor} border-${stat.color}-200 group`}
        >
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.iconBg} ${stat.iconColor} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-800 transition-colors duration-300">
                  {stat.title}
                </h3>
                <p className={`text-2xl font-bold ${stat.textColor} group-hover:scale-105 transition-transform duration-300 inline-block`}>
                  {(stat.value || 0).toLocaleString()}
                </p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-600 mt-1 group-hover:text-gray-700 transition-colors duration-300">
                    {stat.subtitle}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
