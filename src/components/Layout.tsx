"use client";

import {
  AppShell,
  Group,
  Burger,
  UnstyledButton,
  Text,
  rem,
  Drawer,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconFiles, IconHome2, IconUpload } from "@tabler/icons-react";
import Link from "next/link";
import { ReactNode, useState } from "react";
import logo from "@/assets/icon.png";
import Image from "next/image";
import { useMediaQuery } from "@mantine/hooks";

export function Layout({ children }: { children: ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const navigationItems = [
    { icon: IconHome2, label: "Analyzr", link: "/" },
    { icon: IconFiles, label: "Collection", link: "/notadb" },
    { icon: IconUpload, label: "Upload New", link: "/upload" },
  ];

  interface NavButtonProps {
    icon: React.ComponentType<{
      size?: string | number;
      stroke?: string | number;
      className?: string;
    }>;
    label: string;
    link: string;
    onClick?: () => void;
  }

  const NavButton = ({ icon: Icon, label, link, onClick }: NavButtonProps) => (
    <Link href={link} onClick={onClick} className="no-underline">
      <div className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors duration-300 hover:bg-orange-100">
        <Icon size={20} stroke={1.5} className="text-orange-600" />
        <Text
          size="sm"
          fw={500}
          className="text-gray-700 hover:text-orange-700"
        >
          {label}
        </Text>
      </div>
    </Link>
  );

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { desktop: true, mobile: !opened },
      }}
      padding="md"
      className="bg-gray-50"
    >
      <AppShell.Header className="border-b border-gray-200 bg-orange-50">
        <div className="flex items-center justify-between h-full px-4">
          <Group gap={rem(8)} className="flex items-center">
            <Image src={logo} alt="Logo" className="text-orange-600" />
            <Link
              href="/"
              className="text-xl font-bold text-orange-600 no-underline"
            >
              Nota DB
            </Link>
          </Group>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navigationItems.map((item) => (
              <NavButton key={item.label} {...item} />
            ))}
          </div>

          {/* Mobile Burger Menu */}
          <Burger
            opened={opened}
            onClick={toggle}
            className="md:hidden"
            aria-label="Toggle navigation"
          />
        </div>
      </AppShell.Header>

      {/* Mobile Navigation Drawer */}
      <Drawer
        opened={!!(isMobile && opened)}
        onClose={close}
        title="Navigation"
        className="md:hidden"
        overlayProps={{ opacity: 0.5, blur: 4 }}
        position="right"
      >
        <div className="flex flex-col gap-4 p-2">
          {navigationItems.map((item) => (
            <NavButton key={item.label} {...item} onClick={close} />
          ))}
        </div>
      </Drawer>

      <AppShell.Main className="bg-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">{children}</div>
      </AppShell.Main>
    </AppShell>
  );
}
