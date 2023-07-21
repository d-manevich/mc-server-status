start_command = 
    .description = Start the bot
language_command = 
    .description = Change language
admin_command =
    .description = Make user an administrator
setcommands_command =
    .description = Set bot commands
stats_command =
    .description = Bot statistics

add_command =
    .description = Add server for live status updates
    .incorrect_address = Incorrect server address
    .server_unavailable = Server is unavailable
    .server_existed = {$url} was already added
    .server_added = Server {$url} is successfully added

remove_command =
    .description = Delete server from live status updates
    .server_not_added = {$url} was not added
    .server_removed = Server {$url} is successfully removed
stop_command =
    .description = Stop live status
    .all_servers_removed = Unsubscribed from all servers

stat_command =
    .description = All time online stats
    .stats_header = All time online stats
month_command =
    .description = Online stats for this month
    .stats_header = Online stats for this month


welcome = Hello! I help you get online statuses from Minecraft servers.
language = 
    .select = Please, select your language
    .changed = Language successfully changed!
admin =
    .user-not-found = User not found

    .select-user = Please, select a user to change role
    .select-user-btn = Select user
    .your-role-changed = You're {$role ->
        *[USER] a regular user
        [ADMIN] an administrator
    } now.
    .user-role-changed = User with ID {$id} is now {$role ->
        *[USER] a regular user
        [ADMIN] an administrator
    }.
    
    .commands-updated = Commands updated.
unhandled = Unrecognized command. Try /start

errors =
    .internal = Internal error
