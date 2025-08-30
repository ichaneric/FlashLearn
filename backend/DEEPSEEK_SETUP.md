# DeepSeek V3 Setup Instructions

This guide shows how to configure DeepSeek V3 for AI-powered flashcard generation.

## 1. Get DeepSeek API Key

1. Visit [DeepSeek AI Platform](https://platform.deepseek.com/)
2. Sign up or log in to your account
3. Navigate to the API section
4. Generate a new API key
5. Copy the API key for configuration

## 2. Configure Environment Variables

Create a `.env` file in the backend directory with:

```env
# DeepSeek V3 API Configuration
DEEPSEEK_API_KEY=your-actual-api-key-here

# JWT Secret for token verification
JWT_SECRET=your-jwt-secret-key

# Database Configuration (if needed)
DATABASE_URL=your-database-url-here
```

## 3. API Usage Examples

### Basic Generation Request
```json
{
  "title": "Solar System Basics",
  "description": "Learn about planets, stars, and celestial bodies",
  "subject": "Science",
  "topic": "Solar System",
  "cardCount": 8
}
```

### Expected Response
```json
{
  "success": true,
  "cards": [
    {
      "question": "How many planets are in our solar system?",
      "answer": "There are 8 planets in our solar system: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Pluto was reclassified as a dwarf planet in 2006."
    },
    {
      "question": "Which planet is known as the Red Planet?",
      "answer": "Mars is known as the Red Planet due to its reddish appearance, which comes from iron oxide (rust) on its surface. It's the fourth planet from the Sun."
    }
  ]
}
```

## 4. Topic Guidelines

### ✅ Good Topics
- Solar System
- Cell Division
- World War II
- Photosynthesis
- Basic Algebra
- Human Anatomy

### ❌ Complex Topics (Will be rejected)
- Advanced quantum mechanics
- Graduate-level research methodology
- Highly specialized medical procedures
- PhD-level theoretical physics

## 5. Features

- **Smart Question Variety**: Creates different types of questions (definitions, examples, applications)
- **Contextual Answers**: Provides comprehensive, educational answers
- **Complexity Detection**: Automatically rejects overly complex topics
- **Fallback Generation**: Uses template-based generation if API fails
- **Error Handling**: Graceful degradation with helpful error messages

## 6. Testing the Integration

Use the test script to verify the setup:

```bash
cd backend
node test-deepseek.js
```

Or test via API endpoint:
```bash
curl -X POST http://localhost:3000/api/flashcard/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "title": "Biology Basics",
    "description": "Study fundamental biological concepts",
    "subject": "Biology",
    "topic": "Photosynthesis",
    "cardCount": 5
  }'
```

## 7. Troubleshooting

### API Key Issues
- Ensure the API key is valid and active
- Check your DeepSeek account credits/usage
- Verify the key is properly set in environment variables

### Connection Issues
- Check internet connectivity
- Verify the DeepSeek API endpoint is accessible
- Review firewall/proxy settings

### Generation Issues
- Try simpler topics if getting complexity errors
- Reduce card count if hitting limits
- Check the topic follows the guidelines above

## 8. Cost Management

- Monitor API usage through DeepSeek dashboard
- Set appropriate limits for card generation
- Consider caching successful generations
- Use fallback generation for development/testing
