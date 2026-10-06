const AGE_LIMITS = {
  bigAnimals: ['LessThanOne', 'Between1and3', 'Over3'],
  smallAnimals: ['Under2months', 'Between2and6months', 'Over6months'],
  poultry: ['Young', 'Middle', 'Old']
};

const AGE_RANKS = {
  bigAnimals: { LessThanOne: 1, Between1and3: 2, Over3: 3 },
  smallAnimals: { Under2months: 1, Between2and6months: 2, Over6months: 3 },
  poultry: { Young: 1, Middle: 2, Old: 3 }
};

module.exports = { AGE_LIMITS, AGE_RANKS };
