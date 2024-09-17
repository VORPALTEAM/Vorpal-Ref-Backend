import { TelegramAuthData } from 'types'
import { createUser } from '../models/user'

const testUSer = {
    role: 'user',
}

const telegramTestData: TelegramAuthData = {
    id: 1,
    first_name: 'Test',
    username: 'test',
    auth_date: 0,
    hash: ''
}

const userId = createUser(testUSer.role, '', undefined, telegramTestData);

console.log("Created: ", userId)

