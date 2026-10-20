from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
from PIL import Image
import io
import os
from google import genai

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
HAND_REAL_WIDTH_CM = 8.5

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/analyze-meal")
async def analyze_meal(image: UploadFile = File(...)):
    if not GEMINI_API_KEY:
        return {"error": "请先设置 GEMINI_API_KEY 环境变量"}
    
    img_bytes = await image.read()
    img = Image.open(io.BytesIO(img_bytes))
    img_w, img_h = img.size
    
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    prompt = f"""分析这张食物照片。
如果照片里有手掌，以成人手掌平均宽度 {HAND_REAL_WIDTH_CM} 厘米作为参照物，估算每样食物的实际份量。

识别盘中每一种独立的食物，分开列出每一项。对每样食物返回：
- food_name: 食物名称
- weight_g: 估算重量（克）
- calories: 该份量的卡路里
- protein_g: 蛋白质克数
- fibre_g: 膳食纤维克数
- note: 估算依据
- x: 【重要】食物正中心的横坐标，必须落在食物本体区域，不要偏到空白或其他食物处，取值范围 0~{img_w}
- y: 【重要】食物正中心的纵坐标，必须落在食物本体区域，不要偏到空白或其他食物处，取值范围 0~{img_h}

坐标精准要求：
1. x,y 必须精准定位在对应食物的中心，不能落在其他食物或空白处
2. 不要返回固定默认值，必须根据图片实际位置给出
3. 坐标单位为像素，基于原图尺寸：宽度 {img_w}px，高度 {img_h}px

严格以JSON格式返回，不要任何解释文字，只返回JSON：
{{
  "has_hand": true/false,
  "hand_width_cm": {HAND_REAL_WIDTH_CM},
  "foods": [
    {{"food_name": "xxx", "weight_g": 150, "calories": 180, "protein_g": 5.2, "fibre_g": 2.5, "note": "参照手掌估算", "x": 200, "y": 300}}
  ],
  "total_calories": 180,
  "total_protein_g": 5.2,
  "total_fibre_g": 2.5
}}"""

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[prompt, img]
        )
        
        result_text = response.text.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
        
        result = json.loads(result_text.strip())
        print(f"✅ 识别成功: has_hand={result.get('has_hand')}, 食物数={len(result.get('foods',[]))}")
        return result
        
    except Exception as e:
        print(f"❌ 识别失败: {e}")
        return {
            "error": f"识别失败: {str(e)}",
            "has_hand": False,
            "foods": [{"food_name": "请手动填写", "weight_g": 100, "calories": 0, "protein_g": 0, "fibre_g": 0, "note": "", "x": img_w//2, "y": img_h//2}],
            "total_calories": 0,
            "total_protein_g": 0,
            "total_fibre_g": 0
        }

@app.post("/api/recalculate")
async def recalculate(data: dict):
    foods = data.get("foods", [])
    total_cal = sum(f.get("calories", 0) for f in foods)
    total_protein = sum(f.get("protein_g", 0) for f in foods)
    total_fibre = sum(f.get("fibre_g", 0) for f in foods)
    
    return {
        "has_hand": data.get("has_hand", False),
        "foods": foods,
        "total_calories": round(total_cal, 1),
        "total_protein_g": round(total_protein, 1),
        "total_fibre_g": round(total_fibre, 1)
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000)
