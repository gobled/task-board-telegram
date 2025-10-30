import base64
from contextlib import asynccontextmanager
from http import HTTPStatus
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler
from telegram.ext._contexttypes import ContextTypes
from fastapi import FastAPI, Request, Response
import os
import logging

TOKEN = os.environ.get("BOT_TOKEN")
WEBHOOK_URL = os.environ.get("WEBHOOK_URL")
WEBAPP_URL = os.environ.get("WEBAPP_URL")
DIRECT_LINK = os.environ.get("DIRECT_LINK")

# Set up logging
logging.basicConfig(level=logging.INFO)

# Create the Telegram bot application
ptb = (
    ApplicationBuilder()
    .token(TOKEN + "/test")  # Corrected token usage
    .read_timeout(7)
    .get_updates_read_timeout(42)
    .build()
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting bot application" + app.version)
    await ptb.bot.setWebhook(WEBHOOK_URL)  # Set the webhook
    print("Webhook set successfully")
    async with ptb:  # Use ptb lifecycle management
        await ptb.initialize()  # Initialize the bot application
        
        print("Bot initialized")
        yield
        await ptb.stop()  # Clean up when FastAPI stops
        print("Bot stopped")

# Initialize FastAPI app with lifespan
app = FastAPI()

@app.on_event("startup")
async def startup_event():
    print("Startup event triggered!")


# Define the /start command handler
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    print(f"Handling /start for chat_id: {chat_id}")

    try:
        # Encode the chat_id in base64
        encoded_group_id = base64.b64encode(str(chat_id).encode()).decode()
        webapp_url = f"{WEBAPP_URL}?startapp={encoded_group_id}"

        # Create inline keyboard with Web App button and Direct Link button
        buttons = []

        # Add Web App button
        buttons.append(
            InlineKeyboardButton(
                text="Open",
                web_app=WebAppInfo(url=webapp_url)
            )
        )

        # Add Direct Link button if configured
        if DIRECT_LINK:
            buttons.append(
                InlineKeyboardButton(
                    text="Open",
                    url=DIRECT_LINK
                )
            )

        keyboard = InlineKeyboardMarkup([buttons])

        await context.bot.send_message(
            chat_id=chat_id,
            text="Welcome to TaskVaultBot! 🚀\nTap the button below to launch the Mini App.",
            reply_markup=keyboard
        )
        print(f"Handled /start for chat_id: {chat_id}")
    except Exception as e:
        print(f"Error handling /start for chat_id {chat_id}: {e}")

# Define the /webapp command handler
async def webapp(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    print(f"Handling /webapp for chat_id: {chat_id}")
    try:
        # Encode the chat_id in base64
        encoded_group_id = base64.b64encode(str(chat_id).encode()).decode()
        webapp_url = f"{WEBAPP_URL}?startapp={encoded_group_id}"

        # Create inline keyboard with Web App button and Direct Link button
        buttons = []

        # Add Web App button
        buttons.append(
            InlineKeyboardButton(
                text="Open",
                web_app=WebAppInfo(url=webapp_url)
            )
        )

        # Add Direct Link button if configured
        if DIRECT_LINK:
            buttons.append(
                InlineKeyboardButton(
                    text="Open",
                    url=DIRECT_LINK
                )
            )

        keyboard = InlineKeyboardMarkup([buttons])

        await context.bot.send_message(
            chat_id=chat_id,
            text="Here you go 👇",
            reply_markup=keyboard
        )
    except Exception as e:
        print(f"Error handling /webapp for chat_id {chat_id}: {e}")

# FastAPI route to handle Telegram webhook updates
@app.post("/webhook")
async def process_update(request: Request):
    try:
        req = await request.json()

        async with ptb:  # Use ptb lifecycle management
            if (ptb._initialized == False):
                await ptb.start()  # Initialize the bot application
                print("Bot initialized")

            update = Update.de_json(req, ptb.bot)
            print(f"Received update: {update}")
            await ptb.process_update(update)
            print("Bot stopped")

            # await ptb.stop()  # Clean up when FastAPI stops
            # print("Bot stopped")

        return Response(status_code=HTTPStatus.OK)
    except Exception as e:
        print(f"Error while processing update: {e}")
        return Response(status_code=HTTPStatus.INTERNAL_SERVER_ERROR)

# Root endpoint for testing
@app.get("/")
def index():
    return {"message": "This API is working."}

# Register the command handlers
ptb.add_handler(CommandHandler("start", start))
ptb.add_handler(CommandHandler("webapp", webapp))

