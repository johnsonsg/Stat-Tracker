import { useEffect } from "react";
import { useOrganization, useOrganizationList } from "@clerk/clerk-react";

export default function AutoSelectOrganization() {
  const { organization } = useOrganization();
  const { userMemberships, setActive, isLoaded } = useOrganizationList();

  useEffect(() => {
    if (!isLoaded || !setActive) {
      return;
    }

    if (organization?.id) {
      return;
    }

    const memberships = userMemberships?.data ?? [];
    if (memberships.length >= 1) {
      void setActive({ organization: memberships[0].organization.id });
    }
  }, [isLoaded, organization?.id, setActive, userMemberships]);

  return null;
}
