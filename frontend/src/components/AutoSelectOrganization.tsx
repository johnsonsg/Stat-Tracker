import { useEffect } from "react";
import { useOrganizationList } from "@clerk/clerk-react";

export default function AutoSelectOrganization() {
  const { userMemberships, setActive, isLoaded } = useOrganizationList();

  useEffect(() => {
    if (!isLoaded || !setActive) {
      return;
    }

    const memberships = userMemberships?.data ?? [];
    if (memberships.length === 1) {
      void setActive({ organization: memberships[0].organization.id });
    }
  }, [isLoaded, setActive, userMemberships]);

  return null;
}
