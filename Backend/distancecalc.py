# run this once to get test coordinates
import math

lat, lon = 17.4065, 78.4772
# 10m in degrees latitude ≈ 0.00009°
offset = 0.00009

print(f"Original:       {lat}, {lon}")
print(f"8m away (pass): {lat + 0.00007}, {lon}")   # should be rejected (within 10m)
print(f"15m away (pass):{lat + 0.00014}, {lon}")   # should go through