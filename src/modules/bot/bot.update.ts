import { Update, Ctx, Start, On, Action, Command, Hears, Help } from 'nestjs-telegraf';
import { Injectable, Controller } from '@nestjs/common';
import { Brackets, MoreThanOrEqual, Not, Raw, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Context, Markup } from 'telegraf';
import { InlineKeyboardButton, InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';
import { User } from '../user/user.entity';
import { Appointment } from '../appointment/appointment.entity';
import { Location } from '../location/location.entity';
import { AppointmentService } from '../appointment/appointment.service';
import { LocationService } from '../location/location.service';
import { UserService } from '../user/user.service';
import { LanguageCode } from '../common/enums/language-code.enum';

interface IContact {
    phone_number: string,
    first_name: string,
    user_id: number
}

type InlineKeyboardCell = { text: string, callbackData: string };
type InlineKeyboardRow = InlineKeyboardCell[];

const currentLanguageCode = LanguageCode.RU;

const mainMenuKeyboard = Markup.inlineKeyboard([
    [{ text: 'Записаться на занятие', callback_data: 'check-in' }],
    [{ text: 'Забронированные занятия', callback_data: 'booked-list' }],
    [{ text: 'Выбрать язык', callback_data: 'choose-language' }],
])

const excludeDaysOfWeek = [0];
const excludeDates = [{ day: 31, month: 12}, { day: 1, month: 1}]; // месяц и день
const openingHour = 10;
const openingMinute = 0;
const closingHour = 22;
const closingMinute = 0;
const intervalHour = 1;
const intervalMin = 30;
const intervalMs = intervalHour * 60 * 60 * 1000 + intervalMin * 60 * 1000;
const appointmentLimitHours = 1;
const totalBookDays = 30;

function parseActionPayload (action: string): string[] {
    // console.log('action', action)
    // const data = action
    //     .split('?')[1]
    //     .split('&')
    //     .reduce((acc: object, item: string) => {
    //         const [key, value] = item.split('=');
    //         acc[key] = value;
    //         return acc;
    //     }, {});
    // console.log(data)
    // return data
    return action.split('?')[1].split('_');
}

const daysOfWeekMarkup = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(dow => ({ text: dow, callback_data: 'dow-dump'} ));
const lengthOfWeek = 7;

@Update()
// @Injectable()
export class BotUpdate {
    constructor(
        private readonly userService: UserService,
        private readonly appointmentService: AppointmentService,
        private readonly locationService: LocationService,
    ) { }

    @Start()
    async start(@Ctx() ctx: Context) {
        try {
            const user = await this.userService.readOne({
                where: {
                    telegramId: ctx.chat.id,
                    phoneNumber: Not(null),
                }
            })
            // await this.usersRep.createQueryBuilder()
            //     .select(['id'])
            //     .where('telegram_id = :telegramId', { telegramId: ctx.chat.id })
            //     .andWhere('phone_number is not null')
            //     .getRawOne();
    
            if (!user) {
                await ctx.reply(`Приветствую, ${ctx.chat['first_name']}. Оставьте Ваш номер для связи`, {
                    reply_markup: {
                        keyboard: [
                            [{ request_contact: true, text: 'Поделиться номером' }]
                        ],
                        // one_time_keyboard: true,
                        remove_keyboard: true,
                        resize_keyboard: true,
                    },
                })
            } else
                await ctx.reply(`Приветствую, ${ctx.chat['first_name']}`, mainMenuKeyboard);
        } catch(error) {

        }

    }

    @On('contact')
    async onContact(@Ctx() ctx: Context) {
        try {
            console.log('onContact', ctx.chat);
            const contact: IContact = ctx.message['contact'];
            await this.userService.upsert({
                telegramId: ctx.chat.id,
                phoneNumber: contact.phone_number,
                fullName: `${ctx.chat['first_name']} ${ctx.chat?.['last_name'] ?? ''}`.trim(),
                telegramUsername: ctx.chat['username']
            }, ['telegramId']);
    
            await ctx.replyWithMarkdownV2(`Номер добавлен`, Markup.removeKeyboard())
                // .then(() => ctx.reply(`Выбрать город`, Markup.inlineKeyboard(inlineKeyboard)));
                .then(() => ctx.reply(`Основное меню`, mainMenuKeyboard));
        } catch (error) {

        }
    }

    @Action('choose-language')
    async onChooseLanguageAction() {

    }

    @Action('booked-list')
    async onBookedListAction(@Ctx() ctx: Context) {
        try {
            const appointments = await this.appointmentService.readMany({
                where: {
                    telegramId: ctx.chat.id,
                    startDt: MoreThanOrEqual(new Date()),
                    location: {
                        translations: {
                            languageCode: currentLanguageCode,
                        }
                    }
                },
                order: {
                    locationId: 'asc',
                    startDt: 'asc',
                },
                relations: ['location', 'location.translations']
            })
    
            let text: string;
            const inlineKeyboard = [];
            for (const appointment of appointments) {
                text = `${appointment.location.translations[0].name}, `;
                text += `${appointment.startDt.toLocaleString('ru', {
                    minute: '2-digit', hour: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                })}`;
                inlineKeyboard.push([{ 
                    text, 
                    callback_data: `manage-appointment?${appointment.id}` 
                }]);
            }
    
            await ctx.answerCbQuery()
                .then(() => ctx.editMessageText('Забронированные занятия', Markup.inlineKeyboard([
                    ...inlineKeyboard,
                    [{ text: 'В основное меню', callback_data: 'main-menu' }]
                ])));
        } catch (error) {
            ctx.answerCbQuery();
        }
    }

    @Action(/manage-appointment\?\d+/)
    async onManageAppointmentAction(@Ctx() ctx: Context) {
        try {
            const [ appointmentId ] = parseActionPayload(ctx.callbackQuery['data']);
            const appointment = await this.appointmentService.readOne({
                select: {
                    startDt: true,
                    location: { 
                        translations: {
                            name: true,
                        }
                    }
                },
                where: { 
                    id: +appointmentId,
                    location: {
                        translations: {
                            languageCode: currentLanguageCode,
                        }
                    }
                },
                relations: ['location', 'location.translations']
            })
            let text = `${appointment.location.translations[0].name}, `;
            text += `${appointment.startDt.toLocaleString('ru', {
                minute: '2-digit', hour: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
            })}`;
            await ctx.editMessageText(`Управление занятием:\n${text}`, Markup.inlineKeyboard([
                [{ text: 'Отменить занятие', callback_data: `cancel-appointment?${appointmentId}`}],
                [{ text: 'Вернуться к списку', callback_data: 'booked-list' }],
                [{ text: 'В основное меню', callback_data: 'main-menu' }]
            ]));    
        } catch (error) {

        }

    }

    @Action(/cancel-appointment\?\d+/)
    async onCancelAppointmentAction(@Ctx() ctx: Context) {
        try {
            const [ appointmentId ] = parseActionPayload(ctx.callbackQuery['data']);
            await this.appointmentService.softRemove({ id: +appointmentId });
            await ctx.editMessageText(`Занятие отменено`, Markup.inlineKeyboard([
                [{ text: 'Вернуться к списку', callback_data: 'booked-list' }],
                [{ text: 'В основное меню', callback_data: 'main-menu' }]
            ]));
        } catch (error) {

        }
    }

    @Action('main-menu')
    async onMainMenuAction(@Ctx() ctx: Context) {
        console.log('onMainMenuAction', ctx.chat);
        // const prevText = ctx.callbackQuery.message['text'];

        await ctx.answerCbQuery()
            .then(() => ctx.editMessageText('Основное меню', mainMenuKeyboard));
    }

    private generateMonthCalendar(chosenDate: Date, locationId: number): Markup.Markup<InlineKeyboardMarkup> {
        const curDate = new Date(); // Текущая дата
        const curDateLimit = new Date(); // До какого времени можно записаться на занятие в текущий день
        curDateLimit.setHours(closingHour, closingMinute, 0, 0);
        curDateLimit.setTime(curDateLimit.getTime() - intervalMs - (appointmentLimitHours * 60 * 60 * 1000));
        if (curDate > curDateLimit)
            curDate.setDate(curDate.getDate() + 1);
        curDate.setHours(0,0,0,0);

        chosenDate.setDate(1);
        chosenDate.setHours(0,0,0,0);

        const lastDate = curDate > chosenDate ? new Date(curDate) : new Date(chosenDate);
        const prevCount = Math.round((lastDate.getTime() - curDate.getTime()) / 1000 / 60 / 60 / 24);
        const restCount = totalBookDays - prevCount;
        const chosenMonth = lastDate.getMonth();
        const inlineKeyboardDates = [[]];
        let count = 0;

        const curDayOfWeekEu = (lastDate.getDay() || 7) - 1;
        if (curDayOfWeekEu > 0)
            for (let i = 0; i < curDayOfWeekEu; i++)
                inlineKeyboardDates[0].push({ text: ' ', callback_data: 'day-dump' });

        let lastRowIndex = 0;
        while (count < restCount) {
            inlineKeyboardDates[lastRowIndex].push(
                excludeDaysOfWeek.includes(lastDate.getDay()) || 
                excludeDates.some(date => date.day === lastDate.getDate() && date.month === lastDate.getMonth()) ? 
                    { text: ' ', callback_data: 'day-dump' } :
                    { text: lastDate.getDate(), callback_data: `choose-day?${lastDate.getTime()}_${locationId}` }
            );
            count += 1;

            lastDate.setDate(lastDate.getDate() + 1);
            if (lastDate.getMonth() !== chosenMonth)
                break;     
            
            if (inlineKeyboardDates[lastRowIndex].length === lengthOfWeek) {
                inlineKeyboardDates.push([]);
                lastRowIndex += 1;
            }   
        }

        const missingLength = lengthOfWeek - inlineKeyboardDates[lastRowIndex].length;
        if (missingLength)
            for (let i = 0; i < missingLength; i++)
                inlineKeyboardDates[lastRowIndex].push({ text: ' ', callback_data: 'day-dump' });    

        let nextMonthAction = 'next-month-dump';
        if (prevCount + count < totalBookDays) {
            const nextDate = new Date(chosenDate);
            nextDate.setMonth(chosenDate.getMonth() + 1);
            nextMonthAction = `switch-month?${nextDate.getTime()}_${locationId}`;
        }
        let prevMonthAction = 'prev-month-dump';
        if (prevCount > 0) {
            const prevDate = new Date(chosenDate);
            prevDate.setMonth(chosenDate.getMonth() - 1);
            prevMonthAction = `switch-month?${prevDate.getTime()}_${locationId}`;
        }
        return Markup.inlineKeyboard([
            [
                { text: '<', callback_data: prevMonthAction }, 
                { text: chosenDate.toLocaleDateString('ru', { month: 'long', year: 'numeric'}), callback_data: 'month-dump' }, 
                { text: '>', callback_data: nextMonthAction }
            ],
            daysOfWeekMarkup,
            ...inlineKeyboardDates,
            [{ text: 'В основное меню', callback_data: 'main-menu' }]
        ])
    }

    @Action('check-in')
    async onCheckInAction(@Ctx() ctx: Context) {
        console.log('onCheckInAction')
        // const locations = await this.locationRep.find();
        const locations = await this.locationService.readMany({
            where: {
                translations: {
                    languageCode: currentLanguageCode,
                }
            },
            relations: ['translations']
        });
        const inlineKeyboard = [];
        for (const location of locations)
            inlineKeyboard.push([{ 
                text: location.translations[0].name, 
                callback_data: `choose-location?${location.id}`
            }]);

        await ctx.answerCbQuery()
            .then(() => ctx.editMessageText('Выберите город', Markup.inlineKeyboard(inlineKeyboard)));
    }

    @Action(/choose-location\?.+/)
    async onChooseCityAction(@Ctx() ctx: Context) {
        const [locationId] = parseActionPayload(ctx.callbackQuery['data']); 
        console.log('onChooseCityAction', ctx.chat, locationId);
        await ctx.reply(`Выберите дату`, this.generateMonthCalendar(new Date(), +locationId));
    }

    @Action(/switch-month\?\d+_\d+/)
    async onSwitchMonthAction(@Ctx() ctx: Context) {
        const [chosenTimestampDate, locationId] = parseActionPayload(ctx.callbackQuery['data']);
        const chosenDate = new Date(+chosenTimestampDate);
        await ctx.editMessageText(`Выберите дату`, this.generateMonthCalendar(chosenDate, +locationId));
    }

    @Action(/choose-day\?.+/)
    async onChooseDateAction(@Ctx() ctx: Context) {
        try {
            let upperInlineKeyboard: any[] = ctx.callbackQuery['message']['reply_markup']['inline_keyboard'];
            const prevTimeScheduleIndex = upperInlineKeyboard.findIndex(item => item[0]['callback_data'] === 'chosen-date-dump')
            // If the user decides to change the date while selecting an appointment time for a different day
            if (prevTimeScheduleIndex !== -1)
                upperInlineKeyboard = upperInlineKeyboard.slice(0, prevTimeScheduleIndex);
            else /* if (upperInlineKeyboard[upperInlineKeyboard.length - 1][0]['callback_data'] === 'main-menu') */
                upperInlineKeyboard = upperInlineKeyboard.slice(0, upperInlineKeyboard.length - 1);
            
            const [actionTimestamp, locationId] = parseActionPayload(ctx.callbackQuery['data']);
            console.log('onChooseDateAction', ctx.chat, actionTimestamp, locationId);
            const chosenDate = new Date(+actionTimestamp);
            const appointmentLimitHours = 1;
            const curDate = new Date();
            let lastDate = new Date(chosenDate);
            lastDate.setHours(closingHour, closingMinute, 0, 0);
            const openingDate = new Date(chosenDate);
            openingDate.setHours(openingHour, openingMinute, 0, 0);
            const schedule: InlineKeyboardRow = [];
    
            const takenAppointments = await this.appointmentService.readMany({
                select: ['startDt', 'endDt'],
                where: {
                    startDt: Raw(
                        column => `${column} >= date_trunc('day', :date::timestamptz)`, 
                        { date: chosenDate }
                    ),
                    endDt: Raw(
                        column => `${column} <= date_trunc('day', :date::timestamptz) + interval '1 day' - interval '1 second'`,
                        { date: chosenDate }
                    ),
                    locationId: +locationId
                }
            });
            
            const takenTime = takenAppointments.map(item => item.startDt.getTime());
    
            while (lastDate > openingDate) {
                const startDate = new Date(lastDate.getTime() - intervalMs);
                // Check if someone took time
                if (takenTime.includes(startDate.getTime())){
                    lastDate = startDate;
                    continue;
                }
                    
                // Show only the dates that the user can book at least one hour before the workout starts
                if (chosenDate > curDate || startDate.getTime() - appointmentLimitHours*60*60*1000 > curDate.getTime()) {
                    schedule.push({
                        text: `${startDate.toLocaleTimeString('ru', { minute: '2-digit', hour: '2-digit'})}-${lastDate.toLocaleTimeString('ru', { minute: '2-digit', hour: '2-digit'})}`,
                        callbackData: `book-time?${startDate.getTime()}_${lastDate.getTime()}_${locationId}`
                    });
                    lastDate = startDate;
                } else 
                    break;
            }
    
            const inlineKeyboard = [[]];
            for (const [index, scheduleItem] of schedule.reverse().entries()) {
                inlineKeyboard[inlineKeyboard.length - 1].push({ text: scheduleItem.text, callback_data: scheduleItem.callbackData });
                if (inlineKeyboard[inlineKeyboard.length - 1].length === 3 && index < schedule.length - 1)
                    inlineKeyboard.push([]);
            }
    
            if (inlineKeyboard[inlineKeyboard.length - 1].length < 3)
                while (inlineKeyboard[inlineKeyboard.length - 1].length < 3)
                    inlineKeyboard[inlineKeyboard.length - 1].push({ text: ' ', callback_data: 'time-dump' });
    
            // const prevText = ctx.callbackQuery.message['text'];
            await ctx.answerCbQuery(`Выберите время`)
                .then(() => ctx.editMessageText(`Выберите время`, {
                    reply_markup: {
                        inline_keyboard: [
                            ...upperInlineKeyboard,
                            [{ 
                                text: `${chosenDate.toLocaleDateString('ru', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`, 
                                callback_data: 'chosen-date-dump'}],
                            ...inlineKeyboard,
                            [{ text: 'В основное меню', callback_data: 'main-menu' }],
                        ]
                    }
                }));
        } catch(error) {
            ctx.answerCbQuery();
        }
    }

    @Action(/book-time\?.+/)
    async onBookTimeAction(@Ctx() ctx: Context) {
        try {
            const [startTime, endTime, locationId] = parseActionPayload(ctx.callbackQuery['data']);
            console.log('onBookTime', ctx.chat, startTime, endTime, locationId);
            const startDate = new Date(+startTime);
            const endDate = new Date(+endTime);
    
            const insertedData = await this.appointmentService.insert({
                telegramId: ctx.chat.id,
                startDt: new Date(+startTime),
                endDt: new Date(+endTime),
                locationId: +locationId
            })
    
            const location = await this.locationService.readOne({ 
                where: { 
                    id: +locationId,
                    translations: {
                        languageCode: currentLanguageCode,
                    }
                },
                relations: ['translations']
            })
            let text = `${ctx.chat['first_name']}, занятие успешно забронированно:\n`;
            text += `${startDate.toLocaleTimeString('ru', { minute: '2-digit', hour: '2-digit'})}-`;
            text += `${endDate.toLocaleTimeString('ru', { minute: '2-digit', hour: '2-digit'})}, `;
            text += `${startDate.toLocaleDateString('ru', { weekday: 'long', day: '2-digit', month: 'long' })}\n`;
            text += `Город: ${location.translations[0].name}`; 
            await ctx.answerCbQuery(`Выбранное время забронировано`)
                .then(() => ctx.editMessageText(
                    text, 
                    Markup.inlineKeyboard([
                        [{ text: 'В основное меню', callback_data: 'main-menu' }]
                    ])
                ));
        } catch (errot) {
            ctx.answerCbQuery();
        }
    }
    
    @Action(/.*dump/)
    async onDumpAction(@Ctx() ctx: Context) {
        console.log('onDumpAction', ctx.chat);
        await ctx.answerCbQuery();
    }

    @Command('calendar')
    async onCalendarCommand(@Ctx() ctx: Context) {
        await ctx.replyWithMarkdownV2(`Выберите дату`, this.generateMonthCalendar(new Date(), 1));
    }
}