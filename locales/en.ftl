start_command = 
    .description = Start the bot
language_command = 
    .description = Change language
admin_command =
    .description = Make user an administrator
setcommands_command =
    .description = Set bot commands

add_command =
    .description = description: Add server for live status updates
    .incorrect_address = Incorrect server address
    .server_unavailable = Server is unavailable
    .server_existed = {$url} was already added
    .server_added = Server {$url} is successfully added

remove_command =
    .description = description: Delete server from live status updates
stop_command =
    .description = description: Stop live status
stat_command =
    .description = description: All time online stats
month_command =
    .description = description: Online stats for this month


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
