import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AdminBottomNav, { AdminTab } from "@/components/AdminBottomNav";
import AdminDashboard from "@/components/AdminDashboard";
import AdminUsersList from "@/components/AdminUsersList";
import AdminShop from "@/components/AdminShop";

const AdminPanel = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  if (user?.grade !== "Admin") {
    return (
      <div className="px-4 py-6 pb-28 max-w-2xl mx-auto text-center">
        <p className="text-destructive font-semibold">Accès refusé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {activeTab === "dashboard" && <AdminDashboard onNavigate={(tab) => setActiveTab(tab as AdminTab)} />}
      {activeTab === "users" && <AdminUsersList />}
      {activeTab === "shop" && <AdminShop onBack={() => setActiveTab("dashboard")} />}
      <AdminBottomNav activeTab={activeTab} onTabChange={setActiveTab} onBack={onBack} />
    </div>
  );
};

export default AdminPanel;
