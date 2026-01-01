'use client';

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FolderKanban,
  Shield,
  Landmark,
  Wallet,
  Settings,
  Globe,
} from "lucide-react";
import { TasKingLogo } from "./icons";
import { usePathname } from 'next/navigation';
import Link from "next/link";

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/sites", icon: Globe, label: "Project Sites"},
  { href: "/governance", icon: Shield, label: "DAO Governance" },
  { href: "/treasury", icon: Landmark, label: "Treasury" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
];

export function SidebarNav() {
  const pathname = usePathname();
  
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <TasKingLogo className="h-7 w-7 text-primary" />
          <span className="font-bold text-lg">TasKing</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
         <SidebarMenu>
           <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings">
                <Link href="#">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
           </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
