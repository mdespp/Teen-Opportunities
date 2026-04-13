"use client";

type ConnectedUser = {
  id: string;
  name: string;
  linkedinUrl: string;
  image?: string;
};

type ConnectedUsersListProps = {
  users: ConnectedUser[];
};

export default function ConnectedUsersList({ users }: ConnectedUsersListProps) {
  return (
    <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
      {users.map((user) => (
        <div key={user.id} className="text-sm">
          <a
            href={user.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block origin-left font-medium text-[#5b8cff] transition duration-150 ease-out hover:scale-[1.05] hover:text-[#4a7eff]"
          >
            ・ {user.name}
          </a>
          <p className="mt-0.5 break-all pl-4 text-xs text-zinc-500">
            {user.linkedinUrl}
          </p>
        </div>
      ))}
    </div>
  );
}