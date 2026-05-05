"""
Sample data seeder — run with:
    python scripts/seed_data.py
or via Django shell:
    python manage.py shell < scripts/seed_data.py
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from decimal import Decimal
from apps.businesses.models import Business
from apps.accounts.models import User
from apps.customers.models import Customer
from apps.debts.models import Debt, DebtItem
from apps.payments.models import Payment
from apps.products.models import Product


def run():
    print("🌱 Seeding sample data...")

    # 1. Business
    biz, _ = Business.objects.get_or_create(
        name="Baraka Do'koni",
        defaults={"phone": "+998901234567", "address": "Tashkent, Chilonzor 10"}
    )
    print(f"  ✅ Business: {biz.name}")

    # 2. Super admin
    if not User.objects.filter(email="admin@qarz.uz").exists():
        User.objects.create_superuser(
            username="admin",
            email="admin@qarz.uz",
            password="Admin1234!",
            first_name="Super",
            last_name="Admin",
            role="superadmin",
        )
        print("  ✅ Superuser: admin@qarz.uz / Admin1234!")

    # 3. Business owner
    owner, created = User.objects.get_or_create(
        email="owner@qarz.uz",
        defaults={
            "username": "owner",
            "first_name": "Baxtiyor",
            "last_name": "Karimov",
            "role": "owner",
            "business": biz,
        }
    )
    if created:
        owner.set_password("Owner1234!")
        owner.save()
        print("  ✅ Owner: owner@qarz.uz / Owner1234!")

    # 4. Products
    products_data = [
        ("Guruch (1kg)", Decimal("12000"), "kg"),
        ("Qand (1kg)", Decimal("15000"), "kg"),
        ("Un (1kg)", Decimal("8000"), "kg"),
        ("Yog' (1L)", Decimal("22000"), "litr"),
    ]
    products = []
    for name, price, unit in products_data:
        p, _ = Product.objects.get_or_create(
            business=biz, name=name,
            defaults={"price": price, "unit": unit}
        )
        products.append(p)
    print(f"  ✅ {len(products)} products created")

    # 5. Customers
    customers_data = [
        ("Alisher Nazarov", "+998901111111", "Tashkent, Yunusobod"),
        ("Malika Yusupova", "+998902222222", "Tashkent, Mirzo Ulugbek"),
        ("Jasur Toshmatov", "+998903333333", "Tashkent, Sergeli"),
        ("Nodira Hasanova", "+998904444444", "Tashkent, Uchtepa"),
    ]
    customers = []
    for name, phone, address in customers_data:
        c, _ = Customer.objects.get_or_create(
            business=biz, phone=phone,
            defaults={"full_name": name, "address": address}
        )
        customers.append(c)
    print(f"  ✅ {len(customers)} customers created")

    # 6. Debts
    debts_data = [
        (customers[0], Decimal("250000"), Decimal("100000")),
        (customers[1], Decimal("180000"), Decimal("180000")),
        (customers[2], Decimal("320000"), Decimal("0")),
        (customers[3], Decimal("90000"), Decimal("45000")),
    ]
    debts = []
    for customer, total, paid in debts_data:
        debt, created = Debt.objects.get_or_create(
            customer=customer,
            business=biz,
            defaults={"total_amount": total, "description": "Muddatli tovar qarz"},
        )
        debts.append(debt)

    print(f"  ✅ {len(debts)} debts created")

    # 7. Debt items
    if debts[0].items.count() == 0:
        DebtItem.objects.create(
            debt=debts[0], product=products[0],
            name=products[0].name, quantity=5,
            unit_price=products[0].price,
        )
        DebtItem.objects.create(
            debt=debts[0], product=products[1],
            name=products[1].name, quantity=3,
            unit_price=products[1].price,
        )
    print("  ✅ Debt items created")

    # 8. Payments
    payments_data = [
        (debts[0], Decimal("100000"), "cash"),
        (debts[1], Decimal("180000"), "card"),
        (debts[3], Decimal("45000"), "transfer"),
    ]
    for debt, amount, method in payments_data:
        if not debt.payments.exists():
            Payment.objects.create(debt=debt, amount=amount, payment_method=method)
    print("  ✅ Payments created")

    print("\n🎉 Done! Sample data seeded successfully.")
    print("\nLogin credentials:")
    print("  Admin    → admin@qarz.uz    / Admin1234!")
    print("  Owner    → owner@qarz.uz    / Owner1234!")


if __name__ == "__main__":
    run()
