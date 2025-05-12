import { FriendListPlayer, renderFriendslist } from "./friendsList";

export function initFriends() {
    console.log("Friends page initialized");
    getData();
}

function getData(): void {
    // Mock data
    const friendsListData: FriendListPlayer[] = [
        {
            id: '1',
            username: 'Jan Sekne',
            avatarUrl: 'https://img.heroui.chat/image/avatar?w=200&h=200&u=10',
            state: 'In Game',
            profileUrl: 'null'
        },
        {
            id: '2',
            username: 'Flynn Mol',
            avatarUrl: 'https://img.heroui.chat/image/avatar?w=200&h=200&u=11',
            state: 'Online',
            profileUrl: 'null'
        },
        {
            id: '3',
            username: 'Felix Daems',
            avatarUrl: 'https://img.heroui.chat/image/avatar?w=200&h=200&u=12',
            state: 'Offline',
            profileUrl: 'null'
        },
        {
            id: '4',
            username: 'RallyChamp',
            avatarUrl: 'https://img.heroui.chat/image/avatar?w=200&h=200&u=13',
            state: 'In Game',
            profileUrl: 'null'
        },
        {
            id: '5',
            username: 'BallBouncer',
            avatarUrl: 'https://img.heroui.chat/image/avatar?w=200&h=200&u=14',
            state: 'In Game',
            profileUrl: 'null'
        }
    ];

    renderFriendslist(friendsListData);
}