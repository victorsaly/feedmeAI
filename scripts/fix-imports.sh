#!/bin/bash
# Script to fix UI component icon imports

echo "🔧 Fixing UI component icon imports from lucide-react to phosphor-react..."

# Replace common lucide imports with phosphor equivalents
find src/components/ui -name "*.tsx" -type f -exec sed -i '' \
  -e 's|import CheckIcon from "lucide-react/dist/esm/icons/check"|import { Check as CheckIcon } from "phosphor-react"|g' \
  -e 's|import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"|import { CaretDown as ChevronDownIcon } from "phosphor-react"|g' \
  -e 's|import ChevronUpIcon from "lucide-react/dist/esm/icons/chevron-up"|import { CaretUp as ChevronUpIcon } from "phosphor-react"|g' \
  -e 's|import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"|import { CaretRight as ChevronRightIcon } from "phosphor-react"|g' \
  -e 's|import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"|import { CaretLeft as ChevronLeftIcon } from "phosphor-react"|g' \
  -e 's|import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"|import { CaretLeft as ChevronLeft } from "phosphor-react"|g' \
  -e 's|import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"|import { CaretRight as ChevronRight } from "phosphor-react"|g' \
  -e 's|import CircleIcon from "lucide-react/dist/esm/icons/circle"|import { Circle as CircleIcon } from "phosphor-react"|g' \
  -e 's|import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left"|import { ArrowLeft } from "phosphor-react"|g' \
  -e 's|import ArrowRight from "lucide-react/dist/esm/icons/arrow-right"|import { ArrowRight } from "phosphor-react"|g' \
  -e 's|import SearchIcon from "lucide-react/dist/esm/icons/search"|import { MagnifyingGlass as SearchIcon } from "phosphor-react"|g' \
  -e 's|import MinusIcon from "lucide-react/dist/esm/icons/minus"|import { Minus as MinusIcon } from "phosphor-react"|g' \
  -e 's|import XIcon from "lucide-react/dist/esm/icons/x"|import { X as XIcon } from "phosphor-react"|g' \
  -e 's|import PanelLeftIcon from "lucide-react/dist/esm/icons/panel-left"|import { SidebarSimple as PanelLeftIcon } from "phosphor-react"|g' \
  -e 's|import GripVerticalIcon from "lucide-react/dist/esm/icons/grip-vertical"|import { DotsSixVertical as GripVerticalIcon } from "phosphor-react"|g' \
  -e 's|import MoreHorizontalIcon from "lucide-react/dist/esm/icons/more-horizontal"|import { DotsThree as MoreHorizontalIcon } from "phosphor-react"|g' \
  -e 's|import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal"|import { DotsThree as MoreHorizontal } from "phosphor-react"|g' \
  {} \;

# Also remove the recharts import from chart.tsx since we're not using charts
sed -i '' 's|import \* as RechartsPrimitive from "recharts"|// import * as RechartsPrimitive from "recharts" // Not used|g' src/components/ui/chart.tsx

echo "✅ Fixed UI component icon imports"