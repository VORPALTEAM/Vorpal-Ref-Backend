import { TelegramAuthData } from 'types'
import { User } from '../models/user'

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

User.createUser(testUSer.role, '', undefined, telegramTestData)

