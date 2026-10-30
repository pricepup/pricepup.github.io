# key: (replace_include or None, extra_exclude or None)
SKIP_EXTRA = r"(?i)\b(wand|flat iron or curling|styling|nicotine|raclette|pail|countertop|spice box|sofa|sectional|leather|chaise|thomasville|prospera|henredon|nexium|acid reducer|carving|inflatables?|mask|string lights|candy bucket|lamp|kurta|dupatta|machine|massagers?|dolls?|sleep set|trick or treat bags|halloween pillows|toothbrush(es)?)\b"
OVR = {
 'air-freshener': (r'air ?wick|febreze|glade|air freshener|\bair care|scented oil|plug[- ]in|essential mist|freshmatic|renuzit', None),
 'asian-drinks': (r'milkis|mogu|aloe vera drink|\bvita\b|yakult|calpis|grass jelly drink|chrysanthemum|sakura|soya bean drink|coconut juice|ramune|citron drink', None),
 'bread': (None, r'\bdryer\b|softener|bounce'),
 'burgers': (None, r'sausage|hash|chicken|salmon|fish'),
 'fries': (r'fries|wedges|hash ?browns?|tater tots|onion rings|fried potatoes|breakfast potatoes|potato tots|hashbrown', None),
 'cake': (r'cakes?(?! mix)|cupcakes?|\btarts?\b|strudel|danish|cream puff|brownies?|egg tarts?|swiss roll|tiramisu|mochi|lava', r'starter|styling'),
 'cheese-block': (None, r'roll|pot pies?'),
 'cheese-slices': (None, r'sesame'),
 'chips': (None, r'clif|chip energy|gerber'),
 'chocolate': (None, r'probiotic|align'),
 'cookies': (None, r'cadbury'),
 'cream': (None, r'donut|brie|rolls'),
 'desserts': (None, r'trail mix'),
 'detergent': (r'laundry|detergent(?! .*dish)|\btide\b|\bgain\b|persil|biovert|pacs|pods|flings|purex|all free clear', r'dish'),
 'diapers': (None, r'wipes|pail'),
 'dried-fruit': (None, r'amara'),
 'frozen-meal': (None, r'toilet|cleaner'),
 'ginger': (None, r'paste'),
 'green-onion': (None, r'pancake|crackers'),
 'herbs-dry': (None, r'body|wash|biscotti|paneer'),
 'paneer': (r'paneer', r'samosa'),
 'hotdog-buns': (None, r'sliced rolls|beef'),
 'M20260815038': (r'(sliced|shaved|hot ?pot) beef|beef (slices|shabu)|fatty beef|naval plate|beef plate', None),
 'lamb': (None, r'formula|milk'),
 'lemon': (None, r'aide'),
 'maple': (None, r'coffee'),
 'milk': (None, r'brioche|parent'),
 'mushroom': (None, r'bamboo'),
 'noodles': (None, r'pizza'),
 'oil': (None, r'shampoo|lotion'),
 'orange': (None, r'scookie|emergen|pekoe|\btea\b'),
 'plant-milk': (None, r'wax|kurta|blend|wand'),
 'pop': (r'\bpop\b|coca[- ]cola|\bcoke\b|pepsi|sprite|fanta|7up|7 up|ginger ale|canada dry|dr pepper|root beer|mountain dew|\bbrio\b|soft drinks?|\bcrush\b|schweppes|\bcola\b|kombucha|\bsoda\b', r'chocolate|crackers'),
 'potato': (None, r'patties|tikki'),
 'prepared-food': (None, r'bags|cleaner'),
 'salmon': (r'salmon|\bcoho\b|steelhead|sockeye|atlantic salmon', r'lox'),
 'smoked-salmon': (r'smoked salmon|\blox\b', None),
 'sauces': (None, r'corned'),
 'sausage': (None, r'shredded'),
 'shrimp': (None, r'salad'),
 'snack-bars': (None, r'ice bar|dairy milk|cadbury'),
 'ice-cream': (r'ice cream|frozen dessert|gelato|sorbet|popsicle|frozen novelties|ice bar|ice cream bars|drumstick|klondike|haagen|häagen|ben & jerry|breyers|chapman|baskin|lolly|frozen yogurt|mochi ice', None),
 'spinach': (None, r'pinwhee'),
 'squash': (None, r'chocolate|reese|kit\b|light up'),
 'sugar': (None, r'no sugar|drinks'),
 'tissue': (None, r'bath'),
 'toilet-paper': (r'bathroom tissue|bath tissue|toilet paper|toilet tissue|charmin|cashmere|cottonelle|royale|majesta', None),
 'tropical-fruit': (None, r'longanisa'),
 'turkey': (None, r'oven roasted|pepperettes|pot pie'),
 'water': (None, r'laundry|purex'),
 'white-fish': (None, r'flavou?red'),
 'yogurt': (r'yogh?urt|yogourt|yoplait|activia|oikos|danone|danino|iogo|liberte|liberté|\bastro\b|greek|skyr|kefir|\bdahi\b|\blassi\b', r'pretzel|coated|raisin|bites|bars|melts|frozen yogurt|chalo! lassi|drink mix|pasta|breyers'),
 'cereal': (None, r'marshmallow|baby|cerelac'),
 'apple': (None, r'unsweetened'),
 'jam': (None, r'bars?\b|pretzel|reese|candy|halloween'),
 'cheese-block': (None, r'roll|pot pies?'),
}
OVR.update({
 'chocolate': (None, r'probiotic|align|crest|core power|supplement|restora'),
 'juice': (r'juice|five alive|tropicana|oasis|minute maid|simply bev|punch|nectar|exotic juice|lemonade|rubicon|ocean spray|cranberry cocktail|sunny d|del valle|\blassi\b', r'bites|no sugar drinks'),
 'chips': (None, r'clif|chip energy|gerber|toblerone|chocolate|truffles'),
})
OVR.update({
 'tomato': (None, r'chopped|mutti'),
 'ginger': (None, r'paste|fiery'),
 'M20260815033': (None, r'canned|cann'),
 'beef-steak': (None, r'strips'),
 'canned-veg': (r'canned (vegetables|corn|peas|tomatoes)|canned tomatoes|diced tomatoes|crushed tomatoes|chopped tomatoes|passata|tomato paste|kernel corn|cream corn|green giant|saag|baby okra|cut okra|organic canned|frozen vegetables|frozen veg|stir[- ]fry vegetables|broccoli wokly', None),
 'dish-soap': (r'dish (soap|liquid|spray|detergent)|dishwashing liquid|dawn(?! .*dishwasher)|palmolive|sunlight dish|superdish|powerwash|liquid dish', r'dishwasher'),
})
OVR['plant-milk'] = (r'almond (beverage|milk|breeze)|\boat (beverage|milk)|soy (drink|beverage|milk)|earth.s own|\bsilk\b|plant[- ]based beverage|barista|soy drink', r'creamer|yogurt|wax|kurta|blend|wand|formula')
MOVE_BEFORE = {'energy-drink': 'tea'}

# ---------- 5.1 (2026-10-24): pharmacies (Shoppers, London Drugs) and H Mart sell lots of non-food ----------
SKIP_EXTRA += r"|\b(micellar|cleansing oil|toner|bath bombs?|bath set|coffret|mug|nicorette|lozenges|freeze spray|nasal|prostate|milk thistle|breville|espresso machine|dry shampoo|hair gel|body scrub|lip balm|eye shadow|kohl|gloss|train case|supplement|probiotics?|melatonin|biotin|omega|toddler snacks|jerky treats|dumpling surprise|airpods?|airtag|homepod|ipad|iphone|apple watch|headphones?|earphones?|earbuds|speakers?|bluetooth|wireless|camera|maybelline|l'?or[eé]al|covergirl|revlon|neutrogena|olay|aveeno|cerave|eucerin|aquaphor|bio-oil|celimax|glutathione|pdrn|ampoule|serum|\bskin\b|lotion|ointment|blush|liner|foundation|leave-in|polident|denture|hand cream|face cream|eye cream|dark spot|brightening|moisturi[sz]|sunscreen|spf|gift set|kimchi bag|kimchi\)?\(s|mat for kimchi)\b"
def _ex(k, extra):
    inc, exc = OVR.get(k, (None, None)); OVR[k] = (inc, (exc + '|' + extra) if exc else extra)
_ex('herbs-dry', r'old spice|deodorant|\bsecret\b')
_ex('pickles', r'\bbags?\b|\bmat\b|stew')
_ex('cake', r'rice cakes?')
_ex('lemon', r'drops|candy|honey')
_ex('beef-steak', r'maybelline|superstay')
_ex('rice-noodles', r'headphones?|earphones?|aquaphor')
_ex('bread', r'wonderful|croutons|leave-in')
_ex('oil', r'bio-oil|\bskin\b|leave-in|hair|vinegar')
_ex('cream', r'hand cream|\bskin\b|face|gift|liquid cream|brightening|ampoule|polident|foaming|dynasty|reju')
_ex('apple', r'homepod|airpods?|airtag|ipad|iphone|watch')
MOVE_BEFORE['deodorant'] = 'herbs-dry'
_ex('hotdog-buns', r'candy')
_ex('cookies', r'barista')
_ex('salsa', r'chips')
_ex('spinach', r'chips')
_ex('detergent', r'bath tissue|tissues')
_ex('honey', r'drops|roasted|peanuts')
_ex('orange', r'honey|blossom')
_ex('chocolate', r'\bgum\b')
_ex('water', r'john frieda|illuminating')
# --- 2026-10-30 data audit: recurring mis-maps (Silver approved) ---
_ex('cream', r'cleaner|\bvim\b|baby wash|shampoo|sella|parboiled|\brice\b|latte cake|salad cream')
_ex('canned-fruit', r'candy|candies')
_ex('corn', r'candy')
_ex('sweet-pepper', r'cauliflower')
_ex('mushroom', r'battered|zucchini')
_ex('milk', r'milk cake|body milk|nivea')
_ex('margarine', r'vinegar')
_ex('oil', r'body wash|serum')
_ex('deodorant', r'shampoo|conditioner|bar soap')
_ex('chocolate', r'scrubbing bubbles|cleaner|foamer|lysol|toilet')
_ex('pop', r'windex|scrubbing|cleaner')
_ex('cheese-block', r'\brice\b|parboiled|mozzarella block, approx')
_ex('water', r'wipes|sudocrem|clearly canadian')
_ex('toilet-paper', r"126|facial")
_ex('rice', r'rice snacks?|riceworks|crisps')
_ex('noodles', r'makhana')
_ex('bread', r'crackers|mozzarella|cheese sticks')
_ex('tea', r'towels?')
_ex('eggs', r'kinder|chocolate')
_ex('tortilla', r"all-purpose wrap|plastic|cling|\d+' x")
_ex('nutrition-drink', r'\btide\b|detergent|neutrogena')
_ex('soy-sauce', r'panko|bread crumbs')
_ex('asian-sauce', r'roasted chicken')
_ex('cream-cheese', r'mayonnaise')
_ex('pickles', r'mayonnaise')
_ex('desserts', r'candy')
_ex('sugar', r'baked beans?')
_ex('baby-wipes', r'bathroom tissue')
_ex('potato', r'brioche|buns')
_ex('cleaner', r'room freshener|setting spray|mcobeauty')
_ex('mac-cheese', r'cheetos')
_ex('canned-beans', r'masala|spice blend')
_ex('juice', r'juicer')
_ex('honey', r'bronzing|foam')
_ex('dish-soap', r'\bvim\b|cream cleaner')
_ex('zucchini', r'battered|wedges')
_ex('toilet-paper', r'paper towels?')
