#!/bin/bash
# Test specifico per grafici 3D

echo "🧪 TEST GRAFICI 3D ASSISTENTE AI"
echo "================================"

API_KEY="demo_key_123"
BACKEND_URL="http://localhost:5005"

# Test 1: Verifica endpoint chart3d
echo ""
echo "1. Test endpoint /api/chart3d..."

# Test scatter 3D
echo "   Test scatter 3D..."
response=$(curl -s -X POST "$BACKEND_URL/api/chart3d" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "type": "scatter",
    "params": {
      "points": 50
    }
  }')

if echo "$response" | grep -q '"chart3d"'; then
    echo "   ✅ Scatter 3D OK"
else
    echo "   ❌ Scatter 3D FAILED"
    echo "   Response: $response"
fi

# Test surface 3D
echo "   Test surface 3D..."
response=$(curl -s -X POST "$BACKEND_URL/api/chart3d" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "type": "surface",
    "params": {
      "func_str": "x**2 + y**2"
    }
  }')

if echo "$response" | grep -q '"chart3d"'; then
    echo "   ✅ Surface 3D OK"
else
    echo "   ❌ Surface 3D FAILED"
    echo "   Response: $response"
fi

# Test parametric 3D
echo "   Test parametric 3D..."
response=$(curl -s -X POST "$BACKEND_URL/api/chart3d" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "type": "parametric",
    "params": {
      "func_x": "cos(t)",
      "func_y": "sin(t)",
      "func_z": "t"
    }
  }')

if echo "$response" | grep -q '"chart3d"'; then
    echo "   ✅ Parametric 3D OK"
else
    echo "   ❌ Parametric 3D FAILED"
    echo "   Response: $response"
fi

# Test 2: Verifica endpoint matplotlib con 3D
echo ""
echo "2. Test endpoint /api/matplotlib 3D..."

# Test matplotlib scatter 3D
echo "   Test matplotlib scatter3d_seaborn..."
response=$(curl -s -X POST "$BACKEND_URL/api/matplotlib" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "type": "scatter3d_seaborn",
    "points": 100
  }')

if echo "$response" | grep -q '"image"'; then
    echo "   ✅ Matplotlib scatter3d OK"
else
    echo "   ❌ Matplotlib scatter3d FAILED"
    echo "   Response: $response"
fi

# Test matplotlib surface 3D
echo "   Test matplotlib surface3d_seaborn..."
response=$(curl -s -X POST "$BACKEND_URL/api/matplotlib" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "type": "surface3d_seaborn"
  }')

if echo "$response" | grep -q '"image"'; then
    echo "   ✅ Matplotlib surface3d OK"
else
    echo "   ❌ Matplotlib surface3d FAILED"
    echo "   Response: $response"
fi

echo ""
echo "🎯 Test grafici 3D completato!"