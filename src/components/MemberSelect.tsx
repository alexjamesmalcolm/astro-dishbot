import type { Member } from "@utils/groupMe";
import type { MemberData } from "@utils/redis";
import { For, createSignal } from "solid-js";

type ChangeStatus =
  | "Already selected"
  | "Added"
  | "Removed"
  | "Already unselected";

function getStatus({
  memberId,
  selectedMemberIds,
  initiallySelectedMemberIds,
}: {
  memberId: string;
  selectedMemberIds: string[];
  initiallySelectedMemberIds: string[];
}): ChangeStatus {
  const isInitiallySelected = initiallySelectedMemberIds.some(
    (initiallySelectedMember) => {
      return initiallySelectedMember === memberId;
    }
  );
  const isSelectedNow = selectedMemberIds.some((selectedMember) => {
    return selectedMember === memberId;
  });
  if (isSelectedNow && isInitiallySelected) {
    return "Already selected";
  } else if (isSelectedNow && !isInitiallySelected) {
    return "Added";
  } else if (!isSelectedNow && isInitiallySelected) {
    return "Removed";
  } else {
    return "Already unselected";
  }
}

export default function MemberSelect({
  allMembers,
  initiallySelectedMembers,
  name,
  label,
}: {
  allMembers: Member[];
  initiallySelectedMembers: MemberData[];
  name: string;
  label: string;
}) {
  const [changedMembers, setChangedMembers] = createSignal<
    [string, ChangeStatus][]
  >(
    allMembers.map((member) => {
      const isInitiallySelected = initiallySelectedMembers.some(
        (initiallySelectedMember) =>
          initiallySelectedMember.id === member.user_id
      );
      return [
        member.user_id,
        isInitiallySelected ? "Already selected" : "Already unselected",
      ];
    })
  );

  return (
    <>
      <label for={name}>{label}</label>
      <div class="control">
        <div class="select is-multiple">
          <select
            name={name}
            id={name}
            multiple
            onChange={(e) => {
              const selectedMembers = Array.from(
                e.target.selectedOptions,
                (option) => option.value
              );
              setChangedMembers(
                allMembers.map((member): [string, ChangeStatus] => {
                  const status: ChangeStatus = getStatus({
                    memberId: member.user_id,
                    selectedMemberIds: selectedMembers,
                    initiallySelectedMemberIds: initiallySelectedMembers.map(
                      (member) => member.id
                    ),
                  });
                  return [member.user_id, status];
                })
              );
            }}
          >
            <For each={allMembers}>
              {(member) => {
                const isInitiallySelected = initiallySelectedMembers.some(
                  (initiallySelectedMember) =>
                    initiallySelectedMember.id === member.user_id
                );
                return (
                  <option selected={isInitiallySelected} value={member.user_id}>
                    {member.name}
                  </option>
                );
              }}
            </For>
          </select>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          "flex-wrap": "wrap",
        }}
        class="m-1 flex"
      >
        <For each={changedMembers()}>
          {([memberId, status]) => {
            if (status === "Already unselected") return null;
            const member = allMembers.find(
              (member) => member.user_id === memberId
            );
            if (!member) return null;
            return (
              <p
                classList={{
                  tag: true,
                  "is-info": status === "Already selected",
                  "is-danger": status === "Removed",
                  "is-success": status === "Added",
                }}
              >
                {member.name}
              </p>
            );
          }}
        </For>
      </div>
    </>
  );
}
