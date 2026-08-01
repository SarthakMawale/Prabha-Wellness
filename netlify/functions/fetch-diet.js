exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { gender, bmi, goal } = JSON.parse(event.body);
        const API_KEY = process.env.PERPLEXITY_API_KEY;

        if (!API_KEY) {
            return { statusCode: 500, body: JSON.stringify({ error: "API Key missing" }) };
        }

        // --- BMI CATEGORY DETECTION ---
        let bmiCategory = '';
        if (bmi < 18.5) bmiCategory = 'Underweight (BMI < 18.5)';
        else if (bmi < 25) bmiCategory = 'Normal Weight (BMI 18.5-24.9)';
        else if (bmi < 30) bmiCategory = 'Overweight (BMI 25-29.9)';
        else bmiCategory = 'Obese (BMI ≥ 30)';

        // --- NATURAL PROMPT (For Conversational Response) ---
        const prompt = `
            I have a ${gender.toLowerCase()} with BMI ${bmi} (${bmiCategory}).
            
            Please provide:
            1. A brief health assessment based on this BMI range
            2. A personalized 1-day Indian diet plan (breakfast, lunch, snacks, dinner)
            3. Key nutrition tips for achieving ${goal.toLowerCase()}
            
            Keep the tone friendly and motivational. Use simple language.
            Format the response in clear paragraphs with meal suggestions.
        `;

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "sonar-pro", // Uses live search + generates natural response
                messages: [
                    { 
                        role: "system", 
                        content: "You are a certified nutrition advisor. Provide personalized diet advice based on BMI and Indian cuisine preferences. Always use search results to give accurate and updated information."
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                search_domain_filter: ["ncbi.nlm.nih.gov", "who.int", "healthline.com"], // Optional: Focus on health sites
                return_citations: true // Get sources
            })
        });

        const data = await response.json();

        if (!data.choices || !data.choices[0]) {
            return { statusCode: 500, body: JSON.stringify({ error: "AI Error" }) };
        }

        const aiResponse = data.choices[0].message.content;
        const citations = data.citations || []; // Optional: If you want to show sources

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                plan: aiResponse,
                sources: citations // Optional
            })
        };

    } catch (error) {
        console.error("Error:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                error: "Could not generate plan. Please try again later." 
            }) 
        };
    }
};
