import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, AlertTriangle, Settings, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useT } from "@/lib/settings-context";

import { PixelHeart } from "@/components/ui/pixel-heart";

export function AppSidebar() {
  const t = useT();
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (p: string) => (p === "/" ? currentPath === "/" : currentPath.startsWith(p));

  const items = [
    { title: t("nav.dashboard"), url: "/", icon: LayoutDashboard },
    { title: t("nav.patients"), url: "/patients", icon: Users },
    { title: t("nav.anomalies"), url: "/anomalies", icon: AlertTriangle },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2.5 px-3 py-4 select-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 transition-all duration-300 hover:scale-105">
            <PixelHeart size={22} className="animate-pulse" style={{ animationDuration: '2.5s' }} pixelColor="#FFF56D" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-wide bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{t("app.name")}</span>
            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">{t("app.tagline")}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.monitoring")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/settings")} tooltip={t("nav.settings")}>
              <Link to="/settings">
                <Settings />
                <span>{t("nav.settings")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
