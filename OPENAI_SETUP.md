# OpenAI API Setup for Gudang Mitra Chat Feature

## Overview
The AI chat functionality in Gudang Mitra uses OpenAI's GPT-3.5-turbo model to provide intelligent assistance for inventory management queries in both Indonesian and English.

## Getting an OpenAI API Key

### Step 1: Create OpenAI Account
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up for an account or log in if you already have one
3. Verify your email address

### Step 2: Add Payment Method
1. Go to [Billing Settings](https://platform.openai.com/account/billing/overview)
2. Add a payment method (credit card)
3. Add some credits (minimum $5 recommended for testing)

### Step 3: Generate API Key
1. Go to [API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Give it a name like "Gudang Mitra Chat"
4. Copy the API key (starts with `sk-...`)
5. **IMPORTANT**: Save this key securely - you won't be able to see it again!

## Setting Up the API Key

### For Railway Deployment (Production)

1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to the "Variables" tab
4. Add a new environment variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-...`)
5. Click "Add" and redeploy the service

### For Local Development

1. Create or update `server/.env` file:
```env
OPENAI_API_KEY=your-actual-openai-api-key-here
```

2. Make sure this file is in your `.gitignore` to keep the key secure

## Testing the Setup

### 1. Check Server Logs
After deploying with the API key, check your Railway logs:
- Should see: `🤖 OpenAI API Key: Configured`
- Should NOT see: `🤖 OpenAI API Key: Not configured`

### 2. Test Chat Functionality
1. Go to your deployed app: https://gudang-mitra-app.netlify.app
2. Login with your account
3. Navigate to "Chat AI" in the menu
4. Try sending a message like:
   - "Apa saja barang yang tersedia?" (Indonesian)
   - "What items are in stock?" (English)

### 3. Expected Behavior
- Messages should send successfully
- AI should respond in the same language as your query
- AI should provide information about your actual inventory items
- No "Failed to send message" errors

## Cost Considerations

### GPT-3.5-turbo Pricing (as of 2024)
- **Input**: $0.0015 per 1K tokens
- **Output**: $0.002 per 1K tokens

### Estimated Usage
- Average chat message: ~100-200 tokens
- AI response: ~200-400 tokens
- **Cost per conversation**: ~$0.0005-0.001 (less than $0.001)
- **100 conversations**: ~$0.05-0.10

### Cost Control
- Set usage limits in OpenAI dashboard
- Monitor usage in OpenAI billing section
- Consider implementing rate limiting for production

## Troubleshooting

### Common Issues

1. **"Failed to send message"**
   - Check if OPENAI_API_KEY is set in Railway
   - Verify API key is valid and has credits
   - Check Railway logs for specific error messages

2. **"AI service temporarily unavailable"**
   - Usually means you've hit OpenAI rate limits or quota
   - Check your OpenAI billing and usage
   - Wait a few minutes and try again

3. **CORS Errors**
   - Make sure CORS_ORIGIN is set to your Netlify URL
   - Check that the frontend is calling the correct API URL

### Checking Logs

**Railway Logs:**
1. Go to Railway dashboard
2. Click on your backend service
3. Go to "Deployments" tab
4. Click on latest deployment
5. Check logs for errors

**Browser Console:**
1. Press F12 in your browser
2. Go to Console tab
3. Look for any error messages when sending chat messages

## Security Best Practices

1. **Never commit API keys to Git**
2. **Use environment variables only**
3. **Rotate keys periodically**
4. **Set usage limits in OpenAI dashboard**
5. **Monitor usage regularly**

## Alternative Solutions

If you prefer not to use OpenAI or want to reduce costs:

1. **Mock AI Responses**: Implement predefined responses for common queries
2. **Local AI Models**: Use open-source models like Ollama
3. **Other AI Services**: Consider alternatives like Anthropic Claude, Google Gemini, or Azure OpenAI

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Railway and browser logs
3. Verify your OpenAI account status and billing
4. Test with a simple message first

The chat feature should work seamlessly once the OpenAI API key is properly configured!
