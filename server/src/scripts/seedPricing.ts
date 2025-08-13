import { Breed } from '../models/BreedMySQL';
import { AdditionalService } from '../models/AdditionalServiceMySQL';
import sequelize from '../config/database';

export async function seedPricing() {
  const breeds = [
    // Small Dogs (0-15 lbs) - $75
    { species: 'dog', name: 'Chihuahua', sizeCategory: 'small', fullGroomPrice: 75 },
    { species: 'dog', name: 'Pomeranian', sizeCategory: 'small', fullGroomPrice: 75 },
    { species: 'dog', name: 'Shih Tzu', sizeCategory: 'small', fullGroomPrice: 75 },
    { species: 'dog', name: 'Yorkshire Terrier', sizeCategory: 'small', fullGroomPrice: 75 },
    { species: 'dog', name: 'Toy Poodle', sizeCategory: 'small', fullGroomPrice: 75 },
    { species: 'dog', name: 'Bichon Frise', sizeCategory: 'small', fullGroomPrice: 75 },
    { species: 'dog', name: 'Dachshund', sizeCategory: 'small', fullGroomPrice: 75 },
    { species: 'dog', name: 'Maltese', sizeCategory: 'small', fullGroomPrice: 75 },
    { species: 'dog', name: 'Pekingese', sizeCategory: 'small', fullGroomPrice: 75 },
    { species: 'dog', name: 'Pug', sizeCategory: 'small', fullGroomPrice: 75 },
    { species: 'dog', name: 'Tea Cup Dogs', sizeCategory: 'small', fullGroomPrice: 75 },
    
    // Medium Dogs (16-40 lbs) - $100
    { species: 'dog', name: 'Beagle', sizeCategory: 'medium', fullGroomPrice: 100 },
    { species: 'dog', name: 'French Bulldog', sizeCategory: 'medium', fullGroomPrice: 100 },
    { species: 'dog', name: 'Cocker Spaniel', sizeCategory: 'medium', fullGroomPrice: 100 },
    { species: 'dog', name: 'Bulldog', sizeCategory: 'medium', fullGroomPrice: 100 },
    { species: 'dog', name: 'Border Collie', sizeCategory: 'medium', fullGroomPrice: 100 },
    { species: 'dog', name: 'Australian Shepherd', sizeCategory: 'medium', fullGroomPrice: 100 },
    { species: 'dog', name: 'Boxer', sizeCategory: 'medium', fullGroomPrice: 100 },
    { species: 'dog', name: 'Shar Pei', sizeCategory: 'medium', fullGroomPrice: 100 },
    { species: 'dog', name: 'American Pit Bull Terrier', sizeCategory: 'medium', fullGroomPrice: 100 },
    { species: 'dog', name: 'Siberian Husky', sizeCategory: 'medium', fullGroomPrice: 100 },
    { species: 'dog', name: 'Whippet', sizeCategory: 'medium', fullGroomPrice: 100 },
    { species: 'dog', name: 'Standard Poodle', sizeCategory: 'medium', fullGroomPrice: 100 },
    
    // Large Dogs (41-70 lbs) - $125
    { species: 'dog', name: 'Labrador Retriever', sizeCategory: 'large', fullGroomPrice: 125 },
    { species: 'dog', name: 'Golden Retriever', sizeCategory: 'large', fullGroomPrice: 125 },
    { species: 'dog', name: 'German Shepherd', sizeCategory: 'large', fullGroomPrice: 125 },
    { species: 'dog', name: 'Doberman Pinscher', sizeCategory: 'large', fullGroomPrice: 125 },
    { species: 'dog', name: 'Rottweiler', sizeCategory: 'large', fullGroomPrice: 125 },
    { species: 'dog', name: 'Bernese Mountain Dog', sizeCategory: 'large', fullGroomPrice: 125 },
    { species: 'dog', name: 'Irish Setter', sizeCategory: 'large', fullGroomPrice: 125 },
    { species: 'dog', name: 'Rhodesian Ridgeback', sizeCategory: 'large', fullGroomPrice: 125 },
    { species: 'dog', name: 'Weimaraner', sizeCategory: 'large', fullGroomPrice: 125 },
    { species: 'dog', name: 'Akita', sizeCategory: 'large', fullGroomPrice: 125 },
    
    // X Large Dogs (71-90 lbs) - $150
    { species: 'dog', name: 'Doberman Pinscher', sizeCategory: 'xlarge', fullGroomPrice: 150 },
    { species: 'dog', name: 'Boxer', sizeCategory: 'xlarge', fullGroomPrice: 150 },
    { species: 'dog', name: 'Rottweiler', sizeCategory: 'xlarge', fullGroomPrice: 150 },
    { species: 'dog', name: 'Alaskan Malamute', sizeCategory: 'xlarge', fullGroomPrice: 150 },
    { species: 'dog', name: 'German Shepherd', sizeCategory: 'xlarge', fullGroomPrice: 150 },
    { species: 'dog', name: 'Bloodhound', sizeCategory: 'xlarge', fullGroomPrice: 150 },
    { species: 'dog', name: 'Greyhound', sizeCategory: 'xlarge', fullGroomPrice: 150 },
    { species: 'dog', name: 'Siberian Husky', sizeCategory: 'xlarge', fullGroomPrice: 150 },
    { species: 'dog', name: 'Rhodesian Ridgeback', sizeCategory: 'xlarge', fullGroomPrice: 150 },
    { species: 'dog', name: 'Weimaraner', sizeCategory: 'xlarge', fullGroomPrice: 150 },
    
    // XX Large Dogs (91+ lbs) - $175
    { species: 'dog', name: 'Great Dane', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'English Mastiff', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'Bullmastiff', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'Tibetan Mastiff', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'Irish Wolfhound', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'Leonberger', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'Anatolian Shepherd', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'English Mastiff', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'Irish Wolfhound', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'Neapolitan Mastiff', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'Leonberger', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'Tibetan Mastiff', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'Newfoundland', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'Scottish Deerhound', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'Saint Bernard', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'Great Pyrenees', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    { species: 'dog', name: 'Giant Russian Terrier', sizeCategory: 'xxlarge', fullGroomPrice: 175 },
    
    // Cats (all sizes) - $85
    { species: 'cat', name: 'Domestic Shorthair', sizeCategory: 'all', fullGroomPrice: 85 },
    { species: 'cat', name: 'Persian', sizeCategory: 'all', fullGroomPrice: 85 },
    { species: 'cat', name: 'Maine Coon', sizeCategory: 'all', fullGroomPrice: 85 },
    { species: 'cat', name: 'Siamese', sizeCategory: 'all', fullGroomPrice: 85 },
    { species: 'cat', name: 'British Shorthair', sizeCategory: 'all', fullGroomPrice: 85 },
    { species: 'cat', name: 'Russian Blue', sizeCategory: 'all', fullGroomPrice: 85 },
    { species: 'cat', name: 'Scottish Fold', sizeCategory: 'all', fullGroomPrice: 85 },
  ];

  const addOns: Array<any> = [
    { code: 'de-shedding', name: 'De-Shedding Treatment', price: 50 },
    { code: 'teeth-cleaning', name: 'Teeth Cleaning', price: 20 },
    { code: 'preventive-flea-tick', name: 'Preventive Flea & Tick Treatment', price: 35 },
    { code: 'flea-tick', name: 'Flea & Tick Treatment', price: 45 },
    { code: 'de-matting', name: 'De-Matting (starting)', price: 50, description: 'Price varies by severity' },
    { code: 'special-shampoo', name: 'Special Shampoos', price: 25, description: 'Hypoallergenic/Whitening/Medicated' },
    { code: 'cosmetic-dental', name: 'Cosmetic Deep Dental Cleaning', price: 180, description: 'From $180 to $250 depending on size' },
  ];

  for (const b of breeds) {
    const [record] = await (Breed as any).findOrCreate({ where: { species: b.species, name: b.name }, defaults: b });
    await record.update({ fullGroomPrice: b.fullGroomPrice, sizeCategory: b.sizeCategory });
  }

  for (const s of addOns) {
    const [record] = await (AdditionalService as any).findOrCreate({ where: { code: s.code }, defaults: s });
    await record.update({ name: s.name, price: s.price, description: s.description });
  }
}

// Run the seeding function if this file is executed directly
if (require.main === module) {
  async function run() {
    try {
      console.log('🚀 Using MySQL database');
      await sequelize.authenticate();
      await seedPricing();
      console.log('✅ Pricing data seeded successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error seeding pricing data:', error);
      process.exit(1);
    }
  }
  
  run();
}
